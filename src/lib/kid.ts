import { sql } from '@/lib/db'
import { CODE } from '@/lib/http'
import { childFromRequest, type AuthedChild } from '@/lib/child-auth'

// Criança autenticada num totem: o token é dela e o código do totem é da família dela.
export async function childForTotem(request: Request): Promise<AuthedChild | null> {
  const code = new URL(request.url).searchParams.get('code') ?? ''
  if (!CODE.test(code)) return null
  const child = await childFromRequest(request)
  if (!child) return null
  const fam = await sql`SELECT 1 FROM families WHERE totem_code = ${code} AND owner_id = ${child.owner_id}::uuid`
  return fam.length ? child : null
}

// Criança autenticada no aparelho próprio: precisa de token e de acesso liberado pelos pais.
export async function childForDevice(request: Request): Promise<AuthedChild | null> {
  const child = await childFromRequest(request)
  return child?.has_device ? child : null
}

// Tarefas de hoje da criança, na ordem do dia (com horário primeiro).
export function todayTasks(childId: string) {
  return sql`
    SELECT ti.id, ti.status, ti.completed_at, ti.parent_note,
           json_build_object(
             'title', t.title, 'icon', t.icon, 'points', t.points, 'description', t.description,
             'due_time', to_char(t.due_time, 'HH24:MI')
           ) AS tasks
    FROM task_instances ti
    JOIN tasks t ON t.id = ti.task_id
    WHERE ti.child_id = ${childId}::uuid
      AND ti.date = (now() at time zone 'America/Manaus')::date
    ORDER BY t.due_time NULLS LAST, t.created_at
  `
}

// pending -> awaiting_approval, só de hoje e só da própria criança.
export async function markDone(instanceId: string, childId: string) {
  const rows = await sql`
    UPDATE task_instances ti
    SET status = 'awaiting_approval', completed_at = now()
    FROM tasks t, children c
    WHERE ti.id = ${instanceId}::uuid AND ti.child_id = ${childId}::uuid
      AND t.id = ti.task_id AND c.id = ti.child_id
      AND ti.status = 'pending'
      AND ti.date = (now() at time zone 'America/Manaus')::date
    RETURNING t.title AS title, c.name AS child_name, c.owner_id AS owner_id
  `
  return (rows[0] as { title: string; child_name: string; owner_id: string } | undefined) ?? null
}

// Reserva os pontos e cria o pedido numa única instrução (só se houver pontos suficientes).
export async function redeemReward(rewardId: string, child: AuthedChild) {
  const rows = await sql`
    WITH r AS (
      SELECT id, title, icon, cost_points FROM rewards
      WHERE id = ${rewardId}::uuid AND owner_id = ${child.owner_id}::uuid
    ),
    spent AS (
      UPDATE children c SET points = c.points - r.cost_points
      FROM r WHERE c.id = ${child.id}::uuid AND c.points >= r.cost_points
      RETURNING c.id, c.points
    ),
    ins AS (
      INSERT INTO reward_redemptions (reward_id, child_id, title, icon, cost_points)
      SELECT r.id, spent.id, r.title, r.icon, r.cost_points FROM r, spent
      RETURNING id
    )
    SELECT spent.points, (SELECT title FROM r) AS title FROM spent
  `
  return (rows[0] as { points: number; title: string } | undefined) ?? null
}
