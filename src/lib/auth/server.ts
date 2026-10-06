import { createNeonAuth } from '@neondatabase/auth/next/server'
import { sql } from '@/lib/db'

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
})

// Família do usuário logado (cria o registro na primeira vez) ou null.
// Todo dado do painel dos pais é filtrado por este ownerId.
export async function getFamily() {
  const { data: session } = await auth.getSession()
  const user = session?.user
  if (!user) return null

  await sql`INSERT INTO families (owner_id) VALUES (${user.id}::uuid) ON CONFLICT DO NOTHING`
  const rows = await sql`SELECT totem_code FROM families WHERE owner_id = ${user.id}::uuid`
  return { ownerId: user.id as string, totemCode: rows[0].totem_code as string }
}
