import { sql } from '@/lib/db'
import { listRequestedRedemptions } from '@/lib/recompensas'
import { listTasks } from '@/lib/tarefas'
import { descreverRepeticao } from '@/lib/mcp/acoes'

// Consultas só de leitura do conector do Claude, sempre filtradas pela família (ownerId) do responsável que autorizou.
// Sem códigos secretos, links nem e-mails. Os ids são só para o Claude apontar qual tarefa ou prêmio mudar.

// Tarefas ativas com todos os campos que dá para mudar.
export async function listarTarefasCompleto(ownerId: string) {
  const rows = await listTasks(ownerId)
  return rows.map((t) => {
    const rep = descreverRepeticao((t.recurrence as string | null) ?? 'daily', (t.recurrence_days as string[] | null) ?? null)
    return {
      id: t.id as string,
      titulo: t.title as string,
      descricao: (t.description as string | null) ?? '',
      icone: (t.icon as string | null) ?? 'brilho',
      pontos: t.points as number,
      crianca: t.child_name as string,
      horario: (t.due_time as string | null) ?? null,
      repeticao: rep.repeticao,
      dias: rep.dias,
    }
  })
}

// Prêmios cadastrados pela família e quanto custam em pontos.
export async function listarPremios(ownerId: string) {
  const rows = await sql`SELECT id, title, icon, cost_points FROM rewards WHERE owner_id = ${ownerId}::uuid ORDER BY cost_points, created_at`
  return rows.map((r) => ({ id: r.id as string, premio: r.title as string, icone: (r.icon as string | null) ?? 'presente', pontos: r.cost_points as number }))
}

// Pedidos de prêmio que esperam o responsável.
export async function listarPedidos(ownerId: string) {
  const rows = await listRequestedRedemptions(ownerId)
  return rows.map((r) => ({ id: r.id as string, crianca: r.child_name as string, premio: r.title as string, pontos: r.cost_points as number }))
}

// Os últimos 7 dias de cada criança (dia de hoje no fuso da casa, America/Manaus).
export async function resumoDaSemana(ownerId: string) {
  const rows = await sql`
    SELECT c.name, c.points,
           COUNT(ti.id) FILTER (WHERE ti.date >= d.hoje - 6)::int AS tarefas_no_periodo,
           COUNT(ti.id) FILTER (WHERE ti.date >= d.hoje - 6 AND ti.status = 'approved')::int AS aprovadas,
           COUNT(ti.id) FILTER (WHERE ti.status = 'awaiting_approval')::int AS aguardando_aprovacao,
           COUNT(ti.id) FILTER (WHERE ti.status = 'pending' AND ti.parent_note IS NOT NULL)::int AS devolvidas_para_tentar_de_novo,
           COALESCE(SUM(t.points) FILTER (WHERE ti.status = 'approved' AND ti.approved_at >= now() - interval '7 days'), 0)::int AS pontos_ganhos_na_semana
    FROM children c
    CROSS JOIN (SELECT (now() at time zone 'America/Manaus')::date AS hoje) d
    LEFT JOIN task_instances ti ON ti.child_id = c.id
    LEFT JOIN tasks t ON t.id = ti.task_id
    WHERE c.owner_id = ${ownerId}::uuid
    GROUP BY c.id, d.hoje
    ORDER BY c.created_at
  `
  return rows.map((r) => ({
    crianca: r.name as string,
    pontos_agora: r.points as number,
    pontos_ganhos_na_semana: r.pontos_ganhos_na_semana as number,
    tarefas_no_periodo: r.tarefas_no_periodo as number,
    aprovadas: r.aprovadas as number,
    aguardando_aprovacao: r.aguardando_aprovacao as number,
    devolvidas_para_tentar_de_novo: r.devolvidas_para_tentar_de_novo as number,
  }))
}
