import { auth } from '@/lib/auth/server'

// Protege o painel dos pais e o admin (o papel de admin é checado em src/lib/admin.ts). As rotas /api/pais/* validam a sessão por conta própria.
export default auth.middleware({
  loginUrl: '/login',
})

export const config = {
  matcher: ['/pais/:path*', '/admin/:path*'],
}
