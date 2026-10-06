import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { unauthorized } from '@/lib/http'
import { ensureTodayInstances } from '@/lib/instances'

export const dynamic = 'force-dynamic'

// Todas as tarefas de hoje da família, com o estado de cada uma.
export async function GET() {
  const family = await getFamily()
  if (!family) return unauthorized()

  await ensureTodayInstances({ ownerId: family.ownerId })

  const rows = await sql`
    SELECT ti.id, ti.status, ti.parent_note,
           json_build_object('title', t.title, 'icon', t.icon, 'points', t.points) AS tasks,
           json_build_object('id', c.id, 'name', c.name, 'avatar', c.avatar, 'color', c.color) AS child
    FROM task_instances ti
    JOIN tasks t ON t.id = ti.task_id
    JOIN children c ON c.id = ti.child_id
    WHERE c.owner_id = ${family.ownerId}::uuid
      AND ti.date = (now() at time zone 'America/Manaus')::date
    ORDER BY c.created_at, t.created_at
  `
  return NextResponse.json(rows)
}
