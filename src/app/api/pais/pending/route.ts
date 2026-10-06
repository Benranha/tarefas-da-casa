import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { unauthorized } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function GET() {
  const family = await getFamily()
  if (!family) return unauthorized()

  const rows = await sql`
    SELECT ti.id, ti.child_id, ti.completed_at,
           json_build_object('title', t.title, 'icon', t.icon, 'points', t.points) AS tasks,
           json_build_object('name', c.name) AS children
    FROM task_instances ti
    JOIN tasks t ON t.id = ti.task_id
    JOIN children c ON c.id = ti.child_id
    WHERE ti.status = 'awaiting_approval' AND c.owner_id = ${family.ownerId}::uuid
    ORDER BY ti.created_at
  `
  return NextResponse.json(rows)
}
