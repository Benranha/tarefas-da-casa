import { sql } from '@/lib/db'
import { ACCESS_TTL_S, CODE_TTL_S, REFRESH_TTL_S, hashSecret, newSecret, pkceMatches } from '@/lib/mcp/oauth'

// Banco do login OAuth do conector do Claude: clientes, conexões, códigos e tokens.
// Códigos e tokens só são guardados como hash. Veja db/migrations/009_conector_claude.sql.

export type Cliente = { clientId: string; nome: string; redirectUris: string[] }
export type Tokens = { access_token: string; refresh_token: string; token_type: 'Bearer'; expires_in: number }
export type Acesso = { grantId: string; clientId: string; clientName: string; userId: string; familyOwnerId: string }

// Quantos apps podem se registrar por hora no total (teto global; o limite por IP não basta no serverless).
const MAX_REGISTROS_POR_HORA = 300
// Tolerância para uma repetição legítima (duas renovações ao mesmo tempo, resposta perdida): dentro
// deste prazo o token já usado só é recusado. Depois dele, o reaparecimento indica cópia e a conexão é revogada.
const GRACA_S = 30

// null quando o teto de registros da última hora foi atingido.
export async function registrarCliente(nome: string, redirectUris: string[]): Promise<string | null> {
  const clientId = `tf_${newSecret(18)}`
  const rows = await sql`
    INSERT INTO mcp_clients (client_id, client_name, redirect_uris)
    SELECT ${clientId}, ${nome}, ${redirectUris}::text[]
    WHERE (SELECT count(*) FROM mcp_clients WHERE created_at > now() - interval '1 hour') < ${MAX_REGISTROS_POR_HORA}
    RETURNING client_id
  `
  return rows.length ? clientId : null
}

export async function buscarCliente(clientId: string): Promise<Cliente | null> {
  const rows = await sql`SELECT client_id, client_name, redirect_uris FROM mcp_clients WHERE client_id = ${clientId}`
  if (rows.length === 0) return null
  return { clientId: rows[0].client_id as string, nome: rows[0].client_name as string, redirectUris: rows[0].redirect_uris as string[] }
}

// Código de autorização: 5 minutos e uma vez só. Guarda o desafio PKCE para conferir na troca e a família
// que o responsável tinha ao permitir.
export async function criarCodigo(p: { clientId: string; userId: string; familyOwnerId: string; redirectUri: string; codeChallenge: string }): Promise<string> {
  const code = newSecret(32)
  await sql`
    INSERT INTO mcp_codes (code_hash, client_id, user_id, family_owner_id, redirect_uri, code_challenge, expires_at)
    VALUES (${hashSecret(code)}, ${p.clientId}, ${p.userId}::uuid, ${p.familyOwnerId}::uuid, ${p.redirectUri}, ${p.codeChallenge},
            now() + ${CODE_TTL_S} * interval '1 second')
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

// Depois de revogar conexões: tokens e sugestões pendentes delas somem (as sugestões citam nomes e títulos).
async function apagarRestosDasConexoes(ids: string[]) {
  if (ids.length === 0) return
  await Promise.all([
    sql`DELETE FROM mcp_tokens WHERE grant_id = ANY(${ids}::uuid[])`,
    sql`DELETE FROM mcp_proposals WHERE grant_id = ANY(${ids}::uuid[])`,
  ])
}

export type Troca = { ok: true; tokens: Tokens } | { ok: false; error: 'invalid_grant'; descricao: string }

const INVALIDO = (descricao: string): Troca => ({ ok: false, error: 'invalid_grant', descricao })

// Troca o código (+ verificador PKCE) por tokens. O código é consumido antes de qualquer conferência:
// se o mesmo código reaparecer depois, a conexão que ele gerou é revogada.
export async function trocarCodigo(p: { code: string; clientId: string; redirectUri: string; verifier: string }): Promise<Troca> {
  const hash = hashSecret(p.code)
  const rows = await sql`
    UPDATE mcp_codes SET used_at = now()
    WHERE code_hash = ${hash} AND used_at IS NULL AND expires_at > now()
    RETURNING client_id, user_id, family_owner_id, redirect_uri, code_challenge
  `
  if (rows.length === 0) {
    const revogadas = await sql`
      UPDATE mcp_grants SET revoked_at = now()
      WHERE revoked_at IS NULL AND id = (
        SELECT grant_id FROM mcp_codes
        WHERE code_hash = ${hash} AND client_id = ${p.clientId} AND used_at IS NOT NULL AND used_at < now() - ${GRACA_S} * interval '1 second'
      )
      RETURNING id
    `
    await apagarRestosDasConexoes(revogadas.map((g) => g.id as string))
    return INVALIDO('Código inválido, vencido ou já usado.')
  }
  const c = rows[0] as { client_id: string; user_id: string; family_owner_id: string; redirect_uri: string; code_challenge: string }
  if (c.client_id !== p.clientId || c.redirect_uri !== p.redirectUri) return INVALIDO('O código não é deste aplicativo.')
  if (!pkceMatches(p.verifier, c.code_challenge)) return INVALIDO('Verificador PKCE inválido.')

  const grant = await sql`
    INSERT INTO mcp_grants (client_id, user_id, family_owner_id) VALUES (${c.client_id}, ${c.user_id}::uuid, ${c.family_owner_id}::uuid) RETURNING id
  `
  const grantId = grant[0].id as string
  await sql`UPDATE mcp_codes SET grant_id = ${grantId}::uuid WHERE code_hash = ${hash}`
  return { ok: true, tokens: await emitirTokens(grantId) }
}

// Renovação: cada token de renovação serve uma vez. Um já usado que reaparece fora da tolerância
// indica cópia, e a conexão é revogada.
export async function renovar(p: { refreshToken: string; clientId: string }): Promise<Troca> {
  const hash = hashSecret(p.refreshToken)
  const rows = await sql`
    UPDATE mcp_tokens SET used_at = now()
    WHERE token_hash = ${hash} AND kind = 'refresh' AND used_at IS NULL AND expires_at > now()
    RETURNING grant_id
  `
  if (rows.length === 0) {
    const revogadas = await sql`
      UPDATE mcp_grants SET revoked_at = now()
      WHERE revoked_at IS NULL AND client_id = ${p.clientId} AND id = (
        SELECT grant_id FROM mcp_tokens
        WHERE token_hash = ${hash} AND kind = 'refresh' AND used_at IS NOT NULL AND used_at < now() - ${GRACA_S} * interval '1 second'
      )
      RETURNING id
    `
    await apagarRestosDasConexoes(revogadas.map((g) => g.id as string))
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
    SELECT g.id, g.client_id, g.user_id, g.family_owner_id, c.client_name
    FROM mcp_tokens t
    JOIN mcp_grants g ON g.id = t.grant_id
    JOIN mcp_clients c ON c.client_id = g.client_id
    WHERE t.token_hash = ${hashSecret(token)} AND t.kind = 'access' AND t.expires_at > now() AND g.revoked_at IS NULL
  `
  if (rows.length === 0) return null
  const r = rows[0]
  await sql`UPDATE mcp_grants SET last_used_at = now() WHERE id = ${r.id as string}::uuid AND (last_used_at IS NULL OR last_used_at < now() - interval '1 minute')`
  return {
    grantId: r.id as string,
    clientId: r.client_id as string,
    clientName: r.client_name as string,
    userId: r.user_id as string,
    familyOwnerId: r.family_owner_id as string,
  }
}

// RFC 7009: o app pede para encerrar a conexão de um token (de acesso ou de renovação).
export async function revogarPorToken(token: string, clientId: string) {
  const rows = await sql`
    UPDATE mcp_grants SET revoked_at = now()
    WHERE revoked_at IS NULL AND client_id = ${clientId}
      AND id IN (SELECT grant_id FROM mcp_tokens WHERE token_hash = ${hashSecret(token)})
    RETURNING id
  `
  await apagarRestosDasConexoes(rows.map((r) => r.id as string))
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

// Desconectar: o app perde o acesso na hora e as sugestões dele que ainda esperavam são apagadas.
export async function desconectar(userId: string, grantId: string): Promise<boolean> {
  const rows = await sql`
    UPDATE mcp_grants SET revoked_at = now()
    WHERE id = ${grantId}::uuid AND user_id = ${userId}::uuid AND revoked_at IS NULL
    RETURNING id
  `
  if (rows.length === 0) return false
  await apagarRestosDasConexoes([grantId])
  return true
}

// Limpeza diária (cron): o que venceu ou ficou sem uso. Devolve só contagens.
export async function limpeza() {
  const contar = (r: Record<string, unknown>[]) => Number(r[0]?.n ?? 0)
  const [propostas, codigos, tokens, conexoes, clientes] = await Promise.all([
    sql`WITH d AS (DELETE FROM mcp_proposals WHERE created_at < now() - interval '30 days' RETURNING 1) SELECT count(*)::int AS n FROM d`,
    sql`WITH d AS (DELETE FROM mcp_codes WHERE expires_at < now() - interval '1 day' RETURNING 1) SELECT count(*)::int AS n FROM d`,
    sql`WITH d AS (DELETE FROM mcp_tokens WHERE expires_at < now() - interval '1 day' RETURNING 1) SELECT count(*)::int AS n FROM d`,
    sql`WITH d AS (DELETE FROM mcp_grants WHERE revoked_at < now() - interval '30 days' RETURNING 1) SELECT count(*)::int AS n FROM d`,
    sql`WITH d AS (DELETE FROM mcp_clients c WHERE c.created_at < now() - interval '7 days'
                   AND NOT EXISTS (SELECT 1 FROM mcp_grants g WHERE g.client_id = c.client_id) RETURNING 1) SELECT count(*)::int AS n FROM d`,
  ])
  return { propostas: contar(propostas), codigos: contar(codigos), tokens: contar(tokens), conexoes: contar(conexoes), clientes: contar(clientes) }
}
