import { NextResponse, type NextRequest } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Tarefas de hoje de uma criança. Cria as ocorrências do dia a partir das
// tarefas ativas (diárias, ou semanais no dia da semana de hoje).
export async function GET(request: NextRequest) {
  const childId = request.nextUrl.searchParams.get('childId') ?? ''
  if (!UUID.test(childId)) {
    return NextResponse.json({ error: 'childId inválido' }, { status: 400 })
  }

  await sql`
    INSERT INTO task_instances (task_id, child_id, date)
    SELECT t.id, ${childId}::uuid, (now() at time zone 'America/Manaus')::date
    FROM tasks t
    WHERE t.active
      AND (t.assigned_child_id = ${childId}::uuid)
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
