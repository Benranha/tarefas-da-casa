import { sql } from '@/lib/db'
import { commitTool, type Proposal } from '@/lib/ajuda-tools'

// Sugestões que o Claude faz pelo conector. Ele nunca grava nada sozinho: a sugestão fica pendente aqui
// e só vira ação quando o responsável toca em Confirmar na Fila (mesma regra do assistente do painel).

// Quantas sugestões podem esperar ao mesmo tempo por família: a Fila não vira lixeira.
export const MAX_PENDENTES = 20

export type SugestaoGuardada = { ok: true; id: string; repetida: boolean } | { ok: false; error: string }

export async function guardarSugestao(ownerId: string, grantId: string, p: Proposal): Promise<SugestaoGuardada> {
  const args = JSON.stringify(p.args)
  // Sugestões antigas (decididas ou vencidas) somem depois de 30 dias: é o prazo dito em /privacidade.
  await sql`DELETE FROM mcp_proposals WHERE owner_id = ${ownerId}::uuid AND created_at < now() - interval '30 days'`.catch(() => {})
  // O Claude às vezes repete a chamada: a mesma sugestão pendente não vira duas.
  const igual = await sql`
    SELECT id FROM mcp_proposals
    WHERE owner_id = ${ownerId}::uuid AND status = 'pending' AND expires_at > now() AND tool = ${p.tool} AND args = ${args}::jsonb
    LIMIT 1
  `
  if (igual.length > 0) return { ok: true, id: igual[0].id as string, repetida: true }

  const rows = await sql`
    INSERT INTO mcp_proposals (owner_id, grant_id, tool, args, resumo)
    SELECT ${ownerId}::uuid, ${grantId}::uuid, ${p.tool}, ${args}::jsonb, ${p.resumo}
    WHERE (SELECT count(*) FROM mcp_proposals WHERE owner_id = ${ownerId}::uuid AND status = 'pending' AND expires_at > now()) < ${MAX_PENDENTES}
    RETURNING id
  `
  if (rows.length === 0) {
    return { ok: false, error: `Já há ${MAX_PENDENTES} sugestões esperando o responsável. Peça para ele confirmar ou recusar na Fila do Tarefinha antes de sugerir mais.` }
  }
  return { ok: true, id: rows[0].id as string, repetida: false }
}

export type SugestaoPendente = { id: string; resumo: string; app: string | null; criadaEm: string }

export async function listarSugestoes(ownerId: string): Promise<SugestaoPendente[]> {
  const rows = await sql`
    SELECT p.id, p.resumo, p.created_at, c.client_name
    FROM mcp_proposals p
    LEFT JOIN mcp_grants g ON g.id = p.grant_id
    LEFT JOIN mcp_clients c ON c.client_id = g.client_id
    WHERE p.owner_id = ${ownerId}::uuid AND p.status = 'pending' AND p.expires_at > now()
    ORDER BY p.created_at
  `
  return rows.map((r) => ({
    id: r.id as string,
    resumo: r.resumo as string,
    app: (r.client_name as string | null) ?? null,
    criadaEm: new Date(r.created_at as string).toISOString(),
  }))
}

export type Decisao = { ok: true; message: string } | { ok: false; status: 400 | 404 | 409; error: string }

// O responsável tocou em Confirmar ou Recusar. A sugestão é reservada de forma atômica (um toque duplo
// não executa duas vezes) e a ferramenta valida tudo de novo, com as mesmas regras do painel.
export async function decidirSugestao(ownerId: string, userId: string, id: string, acao: 'confirmar' | 'recusar'): Promise<Decisao> {
  const status = acao === 'confirmar' ? 'confirmed' : 'rejected'
  const rows = await sql`
    UPDATE mcp_proposals SET status = ${status}, decided_at = now(), decided_by = ${userId}::uuid
    WHERE id = ${id}::uuid AND owner_id = ${ownerId}::uuid AND status = 'pending' AND expires_at > now()
    RETURNING tool, args
  `
  if (rows.length === 0) return { ok: false, status: 404, error: 'Essa sugestão não está mais esperando. Talvez já tenha sido confirmada ou tenha vencido.' }
  if (acao === 'recusar') return { ok: true, message: 'Sugestão recusada.' }

  let result: Awaited<ReturnType<typeof commitTool>>
  try {
    result = await commitTool(ownerId, userId, rows[0].tool as string, (rows[0].args ?? {}) as Record<string, unknown>)
  } catch (e) {
    // Falha inesperada (por exemplo, o banco caiu no meio): a sugestão não fica "confirmada" sem ter sido feita.
    console.error('propostas: commit falhou:', e instanceof Error ? e.message.slice(0, 300) : 'erro')
    const error = 'Não foi possível executar agora. Confira a Fila e tente de novo.'
    await sql`UPDATE mcp_proposals SET status = 'failed', result_message = ${error} WHERE id = ${id}::uuid`.catch(() => {})
    return { ok: false, status: 409, error }
  }
  if (!result || !result.ok) {
    const error = result && !result.ok ? result.error : 'Não foi possível executar essa sugestão.'
    await sql`UPDATE mcp_proposals SET status = 'failed', result_message = ${error} WHERE id = ${id}::uuid`
    return { ok: false, status: 409, error }
  }
  await sql`UPDATE mcp_proposals SET result_message = ${result.message} WHERE id = ${id}::uuid`
  return { ok: true, message: result.message }
}
