import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getParent } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!(await getParent())) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const rows = await sql`
    SELECT ti.id, ti.child_id, ti.completed_at,
           json_build_object('title', t.title, 'icon', t.icon, 'points', t.points) AS tasks,
           json_build_object('name', c.name) AS children
    FROM task_instances ti
    JOIN tasks t ON t.id = ti.task_id
    JOIN children c ON c.id = ti.child_id
    WHERE ti.status = 'awaiting_approval'
    ORDER BY ti.created_at
  `
  return NextResponse.json(rows)
}
