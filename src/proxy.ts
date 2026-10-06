import { auth } from '@/lib/auth/server'

// Protege o painel dos pais. As rotas /api/pais/* validam a sessão por conta própria.
export default auth.middleware({
  loginUrl: '/login',
})

export const config = {
  matcher: ['/pais/:path*'],
}
