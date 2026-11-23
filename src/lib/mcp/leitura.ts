import { sql } from '@/lib/db'

// Consultas só de leitura que o conector do Claude tem além das do assistente do painel.
// Sempre filtradas pela família (ownerId) do responsável que autorizou. Sem códigos, links nem e-mails.

// Prêmios cadastrados pela família e quanto custam em pontos.
export async function listarPremios(ownerId: string) {
  const rows = await sql`SELECT title, cost_points FROM rewards WHERE owner_id = ${ownerId}::uuid ORDER BY cost_points, created_at`
  return rows.map((r) => ({ premio: r.title as string, pontos: r.cost_points as number }))
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
