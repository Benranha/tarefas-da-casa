import { sql } from '@/lib/db'
import { ACCESS_TTL_S, CODE_TTL_S, REFRESH_TTL_S, hashSecret, newSecret, pkceMatches } from '@/lib/mcp/oauth'

// Banco do login OAuth do conector do Claude: clientes, conexões, códigos e tokens.
// Códigos e tokens só são guardados como hash. Veja db/migrations/009_conector_claude.sql.

export type Cliente = { clientId: string; nome: string; redirectUris: string[] }
export type Tokens = { access_token: string; refresh_token: string; token_type: 'Bearer'; expires_in: number }
export type Acesso = { grantId: string; clientId: string; clientName: string; userId: string }

export async function registrarCliente(nome: string, redirectUris: string[]): Promise<string> {
  const clientId = `tf_${newSecret(18)}`
  await sql`INSERT INTO mcp_clients (client_id, client_name, redirect_uris) VALUES (${clientId}, ${nome}, ${redirectUris}::text[])`
  // Limpeza de passagem (registrar é raro): clientes que ninguém usou e códigos e tokens vencidos.
  await Promise.all([
    sql`DELETE FROM mcp_clients c WHERE c.created_at < now() - interval '7 days'
        AND NOT EXISTS (SELECT 1 FROM mcp_grants g WHERE g.client_id = c.client_id)`,
    sql`DELETE FROM mcp_codes WHERE expires_at < now() - interval '1 day'`,
    sql`DELETE FROM mcp_tokens WHERE expires_at < now() - interval '1 day'`,
  ]).catch(() => {})
  return clientId
}

export async function buscarCliente(clientId: string): Promise<Cliente | null> {
  const rows = await sql`SELECT client_id, client_name, redirect_uris FROM mcp_clients WHERE client_id = ${clientId}`
  if (rows.length === 0) return null
  return { clientId: rows[0].client_id as string, nome: rows[0].client_name as string, redirectUris: rows[0].redirect_uris as string[] }
}

// Código de autorização: 5 minutos e uma vez só. Guarda o desafio PKCE para conferir na troca.
export async function criarCodigo(p: { clientId: string; userId: string; redirectUri: string; codeChallenge: string }): Promise<string> {
  const code = newSecret(32)
  await sql`
    INSERT INTO mcp_codes (code_hash, client_id, user_id, redirect_uri, code_challenge, expires_at)
    VALUES (${hashSecret(code)}, ${p.clientId}, ${p.userId}::uuid, ${p.redirectUri}, ${p.codeChallenge}, now() + ${CODE_TTL_S} * interval '1 second')
  `
  return code
}

async function emitirTokens(grantId: string): Promise<Tokens> {
  const access = newSecret(32)
  const refresh = newSecret(32)
  await sql`
    INSERT INTO mcp_tokens (token_hash, kind, grant_id, expires_at) VALUES
      (${hashSecret(access)}, 'access', ${grantId}::uuid, now() + ${ACCESS_TTL_S} * interval '1 second'),
      (${hashSecret(refresh)}, 'refresh', ${grantId}::uuid, now() + ${REFRESH_TTL_S} * interval '1 second')
  `
  return { access_token: access, refresh_token: refresh, token_type: 'Bearer', expires_in: ACCESS_TTL_S }
}

export type Troca = { ok: true; tokens: Tokens } | { ok: false; error: 'invalid_grant'; descricao: string }

const INVALIDO = (descricao: string): Troca => ({ ok: false, error: 'invalid_grant', descricao })

// Troca o código (+ verificador PKCE) por tokens. O código é consumido antes de qualquer conferência:
// se alguém tentar usar o mesmo código de novo, a conexão que ele gerou é revogada.
export async function trocarCodigo(p: { code: string; clientId: string; redirectUri: string; verifier: string }): Promise<Troca> {
  const hash = hashSecret(p.code)
  const rows = await sql`
    UPDATE mcp_codes SET used_at = now()
    WHERE code_hash = ${hash} AND used_at IS NULL AND expires_at > now()
    RETURNING client_id, user_id, redirect_uri, code_challenge
  `
  if (rows.length === 0) {
    await sql`
      UPDATE mcp_grants SET revoked_at = now()
      WHERE revoked_at IS NULL AND id = (SELECT grant_id FROM mcp_codes WHERE code_hash = ${hash} AND used_at IS NOT NULL)
    `
    return INVALIDO('Código inválido, vencido ou já usado.')
  }
  const c = rows[0] as { client_id: string; user_id: string; redirect_uri: string; code_challenge: string }
  if (c.client_id !== p.clientId || c.redirect_uri !== p.redirectUri) return INVALIDO('O código não é deste aplicativo.')
  if (!pkceMatches(p.verifier, c.code_challenge)) return INVALIDO('Verificador PKCE inválido.')

  const grant = await sql`INSERT INTO mcp_grants (client_id, user_id) VALUES (${c.client_id}, ${c.user_id}::uuid) RETURNING id`
  const grantId = grant[0].id as string
  await sql`UPDATE mcp_codes SET grant_id = ${grantId}::uuid WHERE code_hash = ${hash}`
  return { ok: true, tokens: await emitirTokens(grantId) }
}

// Renovação: cada token de renovação serve uma vez. Se um já usado aparecer de novo, alguém o copiou
// e a conexão é revogada.
export async function renovar(p: { refreshToken: string; clientId: string }): Promise<Troca> {
  const hash = hashSecret(p.refreshToken)
  const rows = await sql`
    UPDATE mcp_tokens SET used_at = now()
    WHERE token_hash = ${hash} AND kind = 'refresh' AND used_at IS NULL AND expires_at > now()
    RETURNING grant_id
  `
  if (rows.length === 0) {
    await sql`
      UPDATE mcp_grants SET revoked_at = now()
      WHERE revoked_at IS NULL AND id = (SELECT grant_id FROM mcp_tokens WHERE token_hash = ${hash} AND kind = 'refresh' AND used_at IS NOT NULL)
    `
    return INVALIDO('Token de renovação inválido, vencido ou já usado.')
  }
  const grantId = rows[0].grant_id as string
  const g = await sql`SELECT client_id FROM mcp_grants WHERE id = ${grantId}::uuid AND revoked_at IS NULL`
  if (g.length === 0 || g[0].client_id !== p.clientId) return INVALIDO('A conexão foi encerrada.')
  return { ok: true, tokens: await emitirTokens(grantId) }
}

// Quem é o dono deste token de acesso? null se não existe, venceu ou a conexão foi encerrada.
export async function verificarAcesso(token: string): Promise<Acesso | null> {
  const rows = await sql`
    SELECT g.id, g.client_id, g.user_id, c.client_name
    FROM mcp_tokens t
    JOIN mcp_grants g ON g.id = t.grant_id
    JOIN mcp_clients c ON c.client_id = g.client_id
    WHERE t.token_hash = ${hashSecret(token)} AND t.kind = 'access' AND t.expires_at > now() AND g.revoked_at IS NULL
  `
  if (rows.length === 0) return null
  const r = rows[0]
  await sql`UPDATE mcp_grants SET last_used_at = now() WHERE id = ${r.id as string}::uuid AND (last_used_at IS NULL OR last_used_at < now() - interval '1 minute')`
  return { grantId: r.id as string, clientId: r.client_id as string, clientName: r.client_name as string, userId: r.user_id as string }
}

// RFC 7009: o app pede para encerrar a conexão de um token (de acesso ou de renovação).
export async function revogarPorToken(token: string, clientId: string) {
  await sql`
    UPDATE mcp_grants SET revoked_at = now()
    WHERE revoked_at IS NULL AND client_id = ${clientId}
      AND id IN (SELECT grant_id FROM mcp_tokens WHERE token_hash = ${hashSecret(token)})
  `
}

export type Conexao = { id: string; app: string; criadaEm: string; usadaEm: string | null }

// Conexões ativas deste responsável (aparecem em Família).
export async function listarConexoes(userId: string): Promise<Conexao[]> {
  const rows = await sql`
    SELECT g.id, c.client_name, g.created_at, g.last_used_at
    FROM mcp_grants g JOIN mcp_clients c ON c.client_id = g.client_id
    WHERE g.user_id = ${userId}::uuid AND g.revoked_at IS NULL
    ORDER BY g.created_at DESC
  `
  return rows.map((r) => ({
    id: r.id as string,
    app: r.client_name as string,
    criadaEm: new Date(r.created_at as string).toISOString(),
    usadaEm: r.last_used_at ? new Date(r.last_used_at as string).toISOString() : null,
  }))
}

// Desconectar: o app perde o acesso na hora e as sugestões dele que ainda esperavam são descartadas.
export async function desconectar(userId: string, grantId: string): Promise<boolean> {
  const rows = await sql`
    UPDATE mcp_grants SET revoked_at = now()
    WHERE id = ${grantId}::uuid AND user_id = ${userId}::uuid AND revoked_at IS NULL
    RETURNING id
  `
  if (rows.length === 0) return false
  await Promise.all([
    sql`DELETE FROM mcp_tokens WHERE grant_id = ${grantId}::uuid`,
    sql`UPDATE mcp_proposals SET status = 'rejected', decided_at = now(), decided_by = ${userId}::uuid WHERE grant_id = ${grantId}::uuid AND status = 'pending'`,
  ])
  return true
}
