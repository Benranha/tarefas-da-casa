import { createNeonAuth } from '@neondatabase/auth/next/server'
import { sql } from '@/lib/db'

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
})

// Família do usuário logado (cria o registro na primeira vez) ou null.
// Todo dado do painel dos pais é filtrado por este ownerId: o id de quem criou a família.
// Quem entrou por convite (family_members) enxerga a mesma família do criador.
export async function getFamily() {
  const { data: session } = await auth.getSession()
  const user = session?.user
  if (!user) return null
  return familyOf(user.id as string, (user.name as string | undefined) ?? '')
}

// A família de um responsável conhecido pelo id (o login do conector do Claude chega com token, sem cookie).
export async function familyOf(userId: string, userName = '') {
  const member = await sql`SELECT family_owner_id FROM family_members WHERE user_id = ${userId}::uuid`
  const ownerId = (member[0]?.family_owner_id as string | undefined) ?? userId
  if (!member.length) {
    await sql`INSERT INTO families (owner_id) VALUES (${ownerId}::uuid) ON CONFLICT DO NOTHING`
  }
  const rows = await sql`SELECT totem_code FROM families WHERE owner_id = ${ownerId}::uuid`
  return {
    userId,
    userName,
    ownerId,
    totemCode: rows[0].totem_code as string,
  }
}
