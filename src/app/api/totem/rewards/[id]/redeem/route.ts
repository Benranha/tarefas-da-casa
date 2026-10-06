import { NextResponse, type NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { CODE, UUID, badRequest } from '@/lib/http'

// Público (totem). Reserva os pontos e cria o pedido numa única instrução:
// só funciona se a criança tiver pontos suficientes e se criança e prêmio
// forem da família dona do código.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const code = request.nextUrl.searchParams.get('code') ?? ''
  const body = await request.json().catch(() => ({}))
  const childId = typeof body.childId === 'string' ? body.childId : ''
  if (!UUID.test(id) || !UUID.test(childId) || !CODE.test(code)) return badRequest()

  const rows = await sql`
    WITH fam AS (SELECT owner_id FROM families WHERE totem_code = ${code}),
    r AS (
      SELECT rw.id, rw.title, rw.icon, rw.cost_points
      FROM rewards rw JOIN fam ON fam.owner_id = rw.owner_id
      WHERE rw.id = ${id}::uuid
    ),
    spent AS (
      UPDATE children c SET points = c.points - r.cost_points
      FROM r, fam
      WHERE c.id = ${childId}::uuid AND c.owner_id = fam.owner_id AND c.points >= r.cost_points
      RETURNING c.id, c.points
    ),
    ins AS (
      INSERT INTO reward_redemptions (reward_id, child_id, title, icon, cost_points)
      SELECT r.id, spent.id, r.title, r.icon, r.cost_points FROM r, spent
      RETURNING id
    )
    SELECT spent.points FROM spent
  `
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Pontos insuficientes' }, { status: 409 })
  }
  return NextResponse.json({ ok: true, points: rows[0].points })
}
