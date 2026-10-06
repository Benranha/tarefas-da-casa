import { createNeonAuth } from '@neondatabase/auth/next/server'

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
})

// Retorna o usuário logado (pai/mãe) ou null.
export async function getParent() {
  const { data: session } = await auth.getSession()
  return session?.user ?? null
}
