import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { unauthorized } from '@/lib/http'

export const dynamic = 'force-dynamic'

// Dados da família: link do totem, responsáveis e convites ainda válidos.
export async function GET() {
  const family = await getFamily()
  if (!family) return unauthorized()

  const [members, invites, parental] = await Promise.all([
    sql`
      SELECT u.id, u.name, u.email, (u.id = ${family.ownerId}::uuid) AS is_owner
      FROM neon_auth."user" u
      WHERE u.id = ${family.ownerId}::uuid
         OR u.id IN (SELECT user_id FROM family_members WHERE family_owner_id = ${family.ownerId}::uuid)
      ORDER BY (u.id = ${family.ownerId}::uuid) DESC, u.name
    `,
    sql`
      SELECT code, expires_at FROM family_invites
      WHERE family_owner_id = ${family.ownerId}::uuid AND used_at IS NULL AND expires_at > now()
      ORDER BY created_at DESC
    `,
    sql`SELECT (parental_pin_hash IS NOT NULL) AS has FROM families WHERE owner_id = ${family.ownerId}::uuid`,
  ])
  return NextResponse.json({
    totemCode: family.totemCode,
    me: family.userId,
    hasParentalCode: Boolean(parental[0]?.has),
    members,
    invites,
  })
}
