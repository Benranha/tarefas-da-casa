import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { familyOf } from '@/lib/auth/server'
import { CORS, limitador, preflight, resourceMetadataUrl } from '@/lib/mcp/oauth'
import { verificarAcesso } from '@/lib/mcp/store'
import { criarServidor } from '@/lib/mcp/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Quantas chamadas cada conexão pode fazer: o Claude não precisa de mais que isso numa conversa.
const muitas = limitador(120, 10 * 60_000)

const negado = (request: Request) =>
  new Response(JSON.stringify({ error: 'Não autenticado. Conecte o Tarefinha de novo.' }), {
    status: 401,
    headers: {
      ...CORS,
      'Content-Type': 'application/json',
      'WWW-Authenticate': `Bearer resource_metadata="${resourceMetadataUrl(request)}"`,
    },
  })

// Servidor MCP (Streamable HTTP, sem sessão): cada chamada traz o token e o servidor é montado só para ela.
export async function POST(request: Request) {
  const token = /^Bearer\s+(\S+)$/i.exec(request.headers.get('authorization') ?? '')?.[1]
  const acesso = token ? await verificarAcesso(token) : null
  if (!acesso) return negado(request)

  if (muitas(acesso.grantId)) {
    return new Response(JSON.stringify({ error: 'Muitas chamadas em pouco tempo. Tente de novo em alguns minutos.' }), {
      status: 429,
      headers: { ...CORS, 'Content-Type': 'application/json', 'Retry-After': '60' },
    })
  }

  const family = await familyOf(acesso.userId)
  const server = criarServidor({ ownerId: family.ownerId, grantId: acesso.grantId })
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
  await server.connect(transport)
  try {
    const res = await transport.handleRequest(request)
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
