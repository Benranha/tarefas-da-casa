import { NextResponse, type NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { CODE, UUID, badRequest, notFound } from '@/lib/http'

export const dynamic = 'force-dynamic'

// Tarefas de hoje de uma criança (da família do código). Cria as ocorrências
// do dia a partir das tarefas ativas (diárias, ou semanais no dia de hoje).
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code') ?? ''
  const childId = request.nextUrl.searchParams.get('childId') ?? ''
  if (!CODE.test(code) || !UUID.test(childId)) return badRequest()

  const owned = await sql`
    SELECT c.id FROM children c JOIN families f ON f.owner_id = c.owner_id
    WHERE c.id = ${childId}::uuid AND f.totem_code = ${code}
  `
  if (owned.length === 0) return notFound()

  await sql`
    INSERT INTO task_instances (task_id, child_id, date)
    SELECT t.id, t.assigned_child_id, (now() at time zone 'America/Manaus')::date
    FROM tasks t
    WHERE t.active
      AND t.assigned_child_id = ${childId}::uuid
      AND (
        t.recurrence = 'daily'
        OR (
          t.recurrence = 'weekly'
          AND lower(to_char(now() at time zone 'America/Manaus', 'Dy')) = ANY (t.recurrence_days)
        )
      )
    ON CONFLICT (task_id, child_id, date) DO NOTHING
  `

  const rows = await sql`
    SELECT ti.id, ti.status, ti.completed_at, ti.parent_note,
           json_build_object('title', t.title, 'icon', t.icon, 'points', t.points) AS tasks
    FROM task_instances ti
    JOIN tasks t ON t.id = ti.task_id
    WHERE ti.child_id = ${childId}::uuid
      AND ti.date = (now() at time zone 'America/Manaus')::date
    ORDER BY t.created_at
  `
  return NextResponse.json(rows)
}
