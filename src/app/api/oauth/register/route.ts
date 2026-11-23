import { oauthError, ipDe, json, limitador, nomeDoCliente, preflight, redirectUriPermitida } from '@/lib/mcp/oauth'
import { registrarCliente } from '@/lib/mcp/store'

export const dynamic = 'force-dynamic'

// O claude.ai registra a partir de poucos endereços compartilhados: o limite por IP é folgado de propósito.
// O teto de verdade é o global, no banco (registrarCliente).
const muitos = limitador(300, 60 * 60_000)

// Registro dinâmico de clientes (RFC 7591): o Claude se registra sozinho na primeira conexão.
// Só clientes públicos (sem segredo, com PKCE) e só com endereços de retorno do Claude ou do próprio computador.
export async function POST(request: Request) {
  if (muitos(ipDe(request))) return oauthError('temporarily_unavailable', 'Muitos registros em pouco tempo. Tente de novo mais tarde.', 429)

  const texto = await request.text().catch(() => '')
  let body: Record<string, unknown> | null = null
  try {
    const parsed = texto.length <= 10_000 ? JSON.parse(texto) : null
    body = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch {}
  if (!body) return oauthError('invalid_client_metadata', 'Envie um JSON com redirect_uris.')

  const uris = Array.isArray(body.redirect_uris) ? body.redirect_uris : []
  if (uris.length === 0 || uris.length > 5 || !uris.every(redirectUriPermitida)) {
    return oauthError('invalid_redirect_uri', 'Endereço de retorno não permitido.')
  }
  const metodo = body.token_endpoint_auth_method
  if (metodo !== undefined && metodo !== 'none') return oauthError('invalid_client_metadata', 'Só clientes públicos (token_endpoint_auth_method: none).')
  const tipos = body.grant_types
  if (tipos !== undefined && (!Array.isArray(tipos) || !tipos.includes('authorization_code'))) {
    return oauthError('invalid_client_metadata', 'grant_types precisa incluir authorization_code.')
  }

  const nome = nomeDoCliente(body.client_name, uris as string[])
  const clientId = await registrarCliente(nome, uris as string[])
  if (!clientId) return oauthError('temporarily_unavailable', 'Muitos registros em pouco tempo. Tente de novo mais tarde.', 429)
  return json(
    {
      client_id: clientId,
      client_name: nome,
      redirect_uris: uris,
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      client_id_issued_at: Math.floor(Date.now() / 1000),
    },
    201,
  )
}

export const OPTIONS = preflight
