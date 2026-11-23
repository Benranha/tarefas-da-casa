import { SCOPE, ipDe, json, limitador, oauthError, preflight } from '@/lib/mcp/oauth'
import { buscarCliente, renovar, trocarCodigo } from '@/lib/mcp/store'

export const dynamic = 'force-dynamic'

const muitos = limitador(60, 10 * 60_000)

// Troca o código (com PKCE) ou o token de renovação por tokens de acesso. Clientes públicos: sem segredo.
export async function POST(request: Request) {
  if (muitos(ipDe(request))) return oauthError('temporarily_unavailable', 'Muitas tentativas. Tente de novo em alguns minutos.', 429)

  const texto = await request.text().catch(() => '')
  if (texto.length > 10_000) return oauthError('invalid_request', 'Pedido grande demais.')
  const p = new URLSearchParams(texto)
  const pega = (k: string) => p.get(k) ?? ''

  const clientId = pega('client_id')
  const cliente = clientId ? await buscarCliente(clientId) : null
  if (!cliente) return oauthError('invalid_client', 'Aplicativo não registrado.', 401)

  const tipo = pega('grant_type')
  let r
  if (tipo === 'authorization_code') {
    const code = pega('code')
    const redirectUri = pega('redirect_uri')
    const verifier = pega('code_verifier')
    if (!code || !redirectUri || !verifier) return oauthError('invalid_request', 'Faltam code, redirect_uri ou code_verifier.')
    r = await trocarCodigo({ code, clientId, redirectUri, verifier })
  } else if (tipo === 'refresh_token') {
    const refreshToken = pega('refresh_token')
    if (!refreshToken) return oauthError('invalid_request', 'Falta refresh_token.')
    r = await renovar({ refreshToken, clientId })
  } else {
    return oauthError('unsupported_grant_type', 'Use authorization_code ou refresh_token.')
  }

  if (!r.ok) return oauthError(r.error, r.descricao)
  return json({ ...r.tokens, scope: SCOPE }, 200, { Pragma: 'no-cache' })
}

export const OPTIONS = preflight
