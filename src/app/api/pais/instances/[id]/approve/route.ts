import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { UUID, badRequest, unauthorized } from '@/lib/http'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const { id } = await params
  if (!UUID.test(id)) return badRequest()

  // Aprova e credita os pontos numa única instrução (atômico), só da própria família.
  const rows = await sql`
    WITH approved AS (
      UPDATE task_instances ti
      SET status = 'approved', approved_at = now(), approved_by = ${family.ownerId}::uuid
      FROM children c
      WHERE ti.id = ${id}::uuid AND c.id = ti.child_id
        AND c.owner_id = ${family.ownerId}::uuid
        AND ti.status = 'awaiting_approval'
      RETURNING ti.child_id, ti.task_id
    )
    UPDATE children c
    SET points = c.points + t.points
    FROM approved a JOIN tasks t ON t.id = a.task_id
    WHERE c.id = a.child_id
    RETURNING c.id
  `
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Tarefa não está aguardando aprovação' }, { status: 409 })
  }
  return NextResponse.json({ ok: true })
}
