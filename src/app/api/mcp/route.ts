import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { familyOf } from '@/lib/auth/server'
import { CORS, limitador, preflight, resourceMetadataUrl } from '@/lib/mcp/oauth'
import { verificarAcesso } from '@/lib/mcp/store'
import { criarServidor } from '@/lib/mcp/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Quantas chamadas cada conexão pode fazer: o Claude não precisa de mais que isso numa conversa.
const muitas = limitador(120, 10 * 60_000)

// Corpo máximo de uma chamada (as ferramentas recebem poucos campos curtos).
const MAX_CORPO = 100_000

const respostaJson = (corpo: unknown, status: number, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra } })

// RFC 6750: sem token, só o aviso de onde se autenticar; com token que não vale, também o motivo.
const negado = (request: Request, tokenInvalido: boolean) =>
  respostaJson({ error: 'Não autenticado. Conecte o Tarefinha de novo.' }, 401, {
    'WWW-Authenticate': `Bearer ${tokenInvalido ? 'error="invalid_token", ' : ''}resource_metadata="${resourceMetadataUrl(request)}"`,
  })

// Servidor MCP (Streamable HTTP, sem sessão): cada chamada traz o token e o servidor é montado só para ela.
export async function POST(request: Request) {
  const token = /^Bearer\s+(\S+)$/i.exec(request.headers.get('authorization') ?? '')?.[1]
  const acesso = token ? await verificarAcesso(token) : null
  if (!acesso) return negado(request, Boolean(token))

  if (muitas(acesso.grantId)) return respostaJson({ error: 'Muitas chamadas em pouco tempo. Tente de novo em alguns minutos.' }, 429, { 'Retry-After': '60' })

  // O corpo é lido aqui: lote de mensagens (array) não é aceito, para o limite valer por chamada.
  const texto = await request.text().catch(() => '')
  if (texto.length > MAX_CORPO) return respostaJson({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Pedido grande demais.' } }, 413)
  let corpo: unknown
  try {
    corpo = JSON.parse(texto)
  } catch {
    return respostaJson({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'JSON inválido.' } }, 400)
  }
  if (Array.isArray(corpo)) {
    return respostaJson({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Envie uma mensagem por chamada.' } }, 400)
  }

  // A conexão vale para a família que o responsável tinha ao permitir. Se ele mudou de família, precisa permitir de novo.
  const family = await familyOf(acesso.userId)
  if (family.ownerId !== acesso.familyOwnerId) {
    return respostaJson({ error: 'A sua família mudou desde que você conectou. Desconecte e conecte o Tarefinha de novo.' }, 403)
  }

  const server = criarServidor({ ownerId: family.ownerId, userId: acesso.userId })
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
  await server.connect(transport)
  try {
    const res = await transport.handleRequest(request, { parsedBody: corpo })
    const headers = new Headers(res.headers)
    for (const [k, v] of Object.entries(CORS)) headers.set(k, v)
    headers.set('Cache-Control', 'no-store')
    return new Response(res.body, { status: res.status, headers })
  } finally {
    await transport.close().catch(() => {})
  }
}

// Sem fluxo de eventos do servidor para o cliente nem sessões: só POST.
const naoPermitido = () => new Response(null, { status: 405, headers: { ...CORS, Allow: 'POST, OPTIONS' } })
export const GET = naoPermitido
export const DELETE = naoPermitido
export const OPTIONS = preflight
