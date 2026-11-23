import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_RETORNO, baseUrl } from '@/lib/mcp/oauth'

export const dynamic = 'force-dynamic'

// Depois do login, volta para a tela de permissão do conector (o painel manda para cá quando há o cookie).
// O cookie só vale se for um endereço do próprio começo do OAuth: nunca leva para outro site.
export async function GET(request: NextRequest) {
  const base = baseUrl(request)
  const valor = request.cookies.get(COOKIE_RETORNO)?.value ?? ''
  const valido = valor.startsWith('/api/oauth/authorize?') && valor.length < 2500
  const res = NextResponse.redirect(valido ? `${base}${valor}` : `${base}/pais`)
  res.cookies.delete(COOKIE_RETORNO)
  return res
}
