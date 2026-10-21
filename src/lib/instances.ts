import { after } from 'next/server'
import { sql } from '@/lib/db'
import { notifyChild } from '@/lib/push'

// Cria as ocorrências de hoje (fuso America/Manaus) a partir das tarefas ativas:
// diárias, ou semanais no dia da semana de hoje. Idempotente.
export async function ensureTodayInstances(scope: { childId: string } | { ownerId: string }) {
  if ('childId' in scope) {
    await sql`
      INSERT INTO task_instances (task_id, child_id, date)
      SELECT t.id, t.assigned_child_id, (now() at time zone 'America/Manaus')::date
      FROM tasks t
      WHERE t.active
        AND t.assigned_child_id = ${scope.childId}::uuid
        AND (
          t.recurrence = 'daily'
          OR (t.recurrence = 'weekly'
              AND lower(to_char(now() at time zone 'America/Manaus', 'Dy')) = ANY (t.recurrence_days))
        )
      ON CONFLICT (task_id, child_id, date) DO NOTHING
    `
    return
  }
  await sql`
    INSERT INTO task_instances (task_id, child_id, date)
    SELECT t.id, t.assigned_child_id, (now() at time zone 'America/Manaus')::date
    FROM tasks t
    JOIN children c ON c.id = t.assigned_child_id
    WHERE t.active
      AND c.owner_id = ${scope.ownerId}::uuid
      AND (
        t.recurrence = 'daily'
        OR (t.recurrence = 'weekly'
            AND lower(to_char(now() at time zone 'America/Manaus', 'Dy')) = ANY (t.recurrence_days))
      )
    ON CONFLICT (task_id, child_id, date) DO NOTHING
  `
}

// Tarefas que as crianças marcaram como feitas e esperam aprovação (a Fila), da própria família.
export async function listAwaitingApproval(ownerId: string) {
  return sql`
    SELECT ti.id, c.name AS child_name, t.title, t.points
    FROM task_instances ti
    JOIN tasks t ON t.id = ti.task_id
    JOIN children c ON c.id = ti.child_id
    WHERE ti.status = 'awaiting_approval' AND c.owner_id = ${ownerId}::uuid
    ORDER BY ti.created_at
  `
}

// Aprova e credita os pontos numa única instrução (atômico), só da própria família.
// Vale para a tarefa que a criança marcou (awaiting_approval) e também para os pais
// aprovarem direto uma tarefa que ainda estava pendente ("feita e aprovada").
export async function approveInstance(ownerId: string, userId: string, id: string) {
  const rows = await sql`
    WITH approved AS (
      UPDATE task_instances ti
      SET status = 'approved', approved_at = now(), approved_by = ${userId}::uuid,
          completed_at = COALESCE(ti.completed_at, now()), parent_note = NULL
      FROM children c
      WHERE ti.id = ${id}::uuid AND c.id = ti.child_id
        AND c.owner_id = ${ownerId}::uuid
        AND ti.status IN ('awaiting_approval', 'pending')
      RETURNING ti.child_id, ti.task_id
    )
    UPDATE children c
    SET points = c.points + t.points
    FROM approved a JOIN tasks t ON t.id = a.task_id
    WHERE c.id = a.child_id
    RETURNING c.id, c.name, t.title, t.points
  `
  if (rows.length === 0) return null
  const { id: childId, name, title, points } = rows[0] as { id: string; name: string; title: string; points: number }
  after(() =>
    notifyChild(childId, {
      title: 'Tarefa aprovada!',
      body: `${title}${points ? ` (+${points} pontos)` : ''}`,
      url: '/filho',
      tag: `approved-${id}`,
    }),
  )
  return { childName: name, title, points }
}
