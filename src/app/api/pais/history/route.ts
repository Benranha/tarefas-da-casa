import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { unauthorized } from '@/lib/http'

export const dynamic = 'force-dynamic'

// Placar por criança + linha do tempo das últimas tarefas aprovadas ou devolvidas.
export async function GET() {
  const family = await getFamily()
  if (!family) return unauthorized()

  const [children, events] = await Promise.all([
    sql`
      SELECT c.id, c.name, c.avatar, c.color, c.points,
             COALESCE(SUM(t.points) FILTER (
               WHERE ti.status = 'approved' AND ti.approved_at >= now() - interval '7 days'
             ), 0)::int AS week_points
      FROM children c
      LEFT JOIN task_instances ti ON ti.child_id = c.id
      LEFT JOIN tasks t ON t.id = ti.task_id
      WHERE c.owner_id = ${family.ownerId}::uuid
      GROUP BY c.id
      ORDER BY c.created_at
    `,
    sql`
      SELECT ti.id, ti.status, ti.parent_note,
             CASE WHEN ti.approved_at IS NOT NULL
                THEN to_char(ti.approved_at at time zone 'America/Manaus', 'YYYY-MM-DD')
                ELSE to_char(ti.date, 'YYYY-MM-DD') END AS day,
             t.title, t.icon, t.points,
             c.name AS child_name, c.color AS child_color
      FROM task_instances ti
      JOIN tasks t ON t.id = ti.task_id
      JOIN children c ON c.id = ti.child_id
      WHERE c.owner_id = ${family.ownerId}::uuid
        AND (ti.status = 'approved' OR (ti.status = 'pending' AND ti.parent_note IS NOT NULL))
      ORDER BY COALESCE(ti.approved_at, ti.date::timestamp at time zone 'America/Manaus') DESC
      LIMIT 50
    `,
  ])

  return NextResponse.json({ children, events })
}
