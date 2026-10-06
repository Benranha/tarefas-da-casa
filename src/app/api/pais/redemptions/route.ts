import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { unauthorized } from '@/lib/http'

export const dynamic = 'force-dynamic'

// Pedidos de prêmio aguardando os pais + os últimos já resolvidos.
export async function GET() {
  const family = await getFamily()
  if (!family) return unauthorized()
  const rows = await sql`
    SELECT rr.id, rr.title, rr.icon, rr.cost_points, rr.status, rr.created_at,
           c.name AS child_name, c.avatar AS child_avatar
    FROM reward_redemptions rr
    JOIN children c ON c.id = rr.child_id
    WHERE c.owner_id = ${family.ownerId}::uuid
    ORDER BY (rr.status = 'requested') DESC, rr.created_at DESC
    LIMIT 40
  `
  return NextResponse.json(rows)
}
