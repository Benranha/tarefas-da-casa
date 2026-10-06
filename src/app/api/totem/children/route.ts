import { NextResponse, type NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { CODE, badRequest } from '@/lib/http'

export const dynamic = 'force-dynamic'

// Crianças da família dona do código do totem, com quantas tarefas de hoje ainda faltam.
// Nunca expõe PIN.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code') ?? ''
  if (!CODE.test(code)) return badRequest('Código inválido')

  const rows = await sql`
    SELECT c.id, c.name, c.avatar, c.color, c.points,
           -- Tarefas de hoje que ainda faltam fazer (ainda não concluídas pela criança).
           (
             SELECT count(*) FROM tasks t
             WHERE t.assigned_child_id = c.id AND t.active
               AND (
                 t.recurrence = 'daily'
                 OR (t.recurrence = 'weekly'
                     AND lower(to_char(now() at time zone 'America/Manaus', 'Dy')) = ANY (t.recurrence_days))
               )
               AND NOT EXISTS (
                 SELECT 1 FROM task_instances ti
                 WHERE ti.task_id = t.id AND ti.child_id = c.id
                   AND ti.date = (now() at time zone 'America/Manaus')::date
                   AND ti.status IN ('approved', 'awaiting_approval')
               )
           )::int AS todo_count,
           (
             SELECT count(*) FROM tasks t
             WHERE t.assigned_child_id = c.id AND t.active
               AND (
                 t.recurrence = 'daily'
                 OR (t.recurrence = 'weekly'
                     AND lower(to_char(now() at time zone 'America/Manaus', 'Dy')) = ANY (t.recurrence_days))
               )
           )::int AS tasks_today
    FROM children c JOIN families f ON f.owner_id = c.owner_id
    WHERE f.totem_code = ${code}
    ORDER BY c.created_at
  `
  return NextResponse.json(rows)
}
