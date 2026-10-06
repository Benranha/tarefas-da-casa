import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { badRequest, unauthorized } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function GET() {
  const family = await getFamily()
  if (!family) return unauthorized()
  const rows = await sql`
    SELECT id, title, icon, cost_points FROM rewards
    WHERE owner_id = ${family.ownerId}::uuid ORDER BY cost_points, created_at
  `
  return NextResponse.json(rows)
}

export async function POST(request: Request) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const body = await request.json().catch(() => ({}))
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 80) : ''
  const icon = typeof body.icon === 'string' ? body.icon.trim().slice(0, 24) : 'presente'
  const cost = Number.isInteger(body.cost) ? body.cost : NaN
  if (!title || !(cost >= 1 && cost <= 100000)) return badRequest('Informe o prêmio e o custo em pontos')

  const rows = await sql`
    INSERT INTO rewards (owner_id, title, icon, cost_points)
    VALUES (${family.ownerId}::uuid, ${title}, ${icon || '🎁'}, ${cost})
    RETURNING id, title, icon, cost_points
  `
  return NextResponse.json(rows[0], { status: 201 })
}
