import { sql } from '@/lib/db'

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
