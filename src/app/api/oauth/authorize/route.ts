import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/lib/auth/server'
import { CAMPOS_PEDIDO, COOKIE_RETORNO, baseUrl, resourceUrl, validarPedido } from '@/lib/mcp/oauth'
import { buscarCliente } from '@/lib/mcp/store'

export const dynamic = 'force-dynamic'

// Começo do login do conector do Claude. Confere o pedido (sem redirecionar para endereço não confiável),
// manda quem ainda não entrou para o login (lembrando para onde voltar) e leva quem já entrou para a tela
// "Permitir que o Claude use o Tarefinha?".
export async function GET(request: NextRequest) {
  const base = baseUrl(request)
  const tela = (query: string) => NextResponse.redirect(`${base}/oauth/permitir?${query}`)

  const pedido = validarPedido(request.nextUrl.searchParams, resourceUrl(request))
  if (!pedido.ok) return tela('erro=1')
  const cliente = await buscarCliente(pedido.pedido.clientId)
  if (!cliente || !cliente.redirectUris.includes(pedido.pedido.redirectUri)) return tela('erro=1')

  // Só repassa os campos do pedido, nada mais.
  const limpo = new URLSearchParams()
  for (const campo of CAMPOS_PEDIDO) {
    const v = request.nextUrl.searchParams.get(campo)
    if (v) limpo.set(campo, v)
  }

  const { data: session } = await auth.getSession()
  if (!session?.user) {
    const res = NextResponse.redirect(`${base}/login`)
    res.cookies.set(COOKIE_RETORNO, `/api/oauth/authorize?${limpo.toString()}`, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60,
      path: '/',
    })
    return res
  }
  return tela(limpo.toString())
}
