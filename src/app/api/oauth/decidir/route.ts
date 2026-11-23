import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/lib/auth/server'
import { CAMPOS_PEDIDO, baseUrl, resourceUrl, validarPedido } from '@/lib/mcp/oauth'
import { buscarCliente, criarCodigo } from '@/lib/mcp/store'

export const dynamic = 'force-dynamic'

// O responsável tocou em Permitir ou Agora não na tela do conector. Só aceita o formulário vindo do
// próprio site, com a sessão dele, e repete todas as conferências do pedido.
export async function POST(request: NextRequest) {
  const base = baseUrl(request)

  // Contra pedido forjado por outro site: o navegador sempre manda Origin em POST de formulário.
  const origem = request.headers.get('origin')
  let hostOrigem = ''
  try {
    hostOrigem = origem ? new URL(origem).host : ''
  } catch {}
  if (!hostOrigem || (hostOrigem !== request.nextUrl.host && hostOrigem !== new URL(base).host)) {
    return NextResponse.json({ error: 'Origem não permitida' }, { status: 403 })
  }

  const form = await request.formData().catch(() => null)
  if (!form) return NextResponse.redirect(`${base}/oauth/permitir?erro=1`, 303)

  const pedido = validarPedido(form, resourceUrl(request))
  if (!pedido.ok) return NextResponse.redirect(`${base}/oauth/permitir?erro=1`, 303)
  const { clientId, redirectUri, codeChallenge, state } = pedido.pedido
  const cliente = await buscarCliente(clientId)
  if (!cliente || !cliente.redirectUris.includes(redirectUri)) return NextResponse.redirect(`${base}/oauth/permitir?erro=1`, 303)

  const limpo = new URLSearchParams()
  for (const campo of CAMPOS_PEDIDO) {
    const v = form.get(campo)
    if (typeof v === 'string' && v) limpo.set(campo, v)
  }

  // Sessão acabou no meio do caminho: volta ao começo, que pede o login de novo.
  const { data: session } = await auth.getSession()
  const userId = session?.user?.id as string | undefined
  if (!userId) return NextResponse.redirect(`${base}/api/oauth/authorize?${limpo.toString()}`, 303)

  const volta = new URL(redirectUri)
  if (form.get('decisao') === 'permitir') {
    volta.searchParams.set('code', await criarCodigo({ clientId, userId, redirectUri, codeChallenge }))
  } else {
    volta.searchParams.set('error', 'access_denied')
    volta.searchParams.set('error_description', 'O responsável não permitiu o acesso.')
  }
  if (state) volta.searchParams.set('state', state)
  return NextResponse.redirect(volta.toString(), 303)
}
