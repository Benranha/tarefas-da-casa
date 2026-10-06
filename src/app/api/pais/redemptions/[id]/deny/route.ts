import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { UUID, badRequest, unauthorized } from '@/lib/http'

// Recusa o pedido e devolve os pontos reservados, numa única instrução.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const { id } = await params
  if (!UUID.test(id)) return badRequest()

  const rows = await sql`
    WITH denied AS (
      UPDATE reward_redemptions rr
      SET status = 'denied', resolved_at = now()
      FROM children c
      WHERE rr.id = ${id}::uuid AND c.id = rr.child_id
        AND c.owner_id = ${family.ownerId}::uuid AND rr.status = 'requested'
      RETURNING rr.child_id, rr.cost_points
    )
    UPDATE children c SET points = c.points + d.cost_points
    FROM denied d WHERE c.id = d.child_id
    RETURNING c.id
  `
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Pedido não está aguardando' }, { status: 409 })
  }
  return NextResponse.json({ ok: true })
}
