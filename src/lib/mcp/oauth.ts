import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

// Peças puras do login OAuth do conector do Claude (sem banco, fáceis de testar).
// O servidor segue OAuth 2.1: só código + PKCE (S256), clientes públicos, redirecionamento fixo.

export const MCP_PATH = '/api/mcp'
export const SCOPE = 'tarefinha'
export const ACCESS_TTL_S = 60 * 60
export const REFRESH_TTL_S = 30 * 24 * 60 * 60
export const CODE_TTL_S = 5 * 60
// Guarda para onde voltar quando a pessoa precisa entrar antes de autorizar (mesmo jeito do convite da família).
export const COOKIE_RETORNO = 'tarefinha-oauth'

// Endereço público do app: o domínio configurado, ou o da própria requisição (dev e previews).
export function enderecoPublico(origemDaRequisicao: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configured && /^https?:\/\//i.test(configured)) return configured.replace(/\/+$/, '')
  return origemDaRequisicao
}

export const baseUrl = (request: Request) => enderecoPublico(new URL(request.url).origin)

export const resourceUrl = (request: Request) => `${baseUrl(request)}${MCP_PATH}`
export const resourceMetadataUrl = (request: Request) => `${baseUrl(request)}/.well-known/oauth-protected-resource`

export function newSecret(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

// Tokens e códigos só existem em claro para quem os recebe: o banco guarda o hash.
export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex')
}

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

// PKCE: o desafio é a base64url do SHA-256 do verificador (método S256, o único aceito).
export const CHALLENGE = /^[A-Za-z0-9_-]{43}$/
export const VERIFIER = /^[A-Za-z0-9._~-]{43,128}$/

export function pkceMatches(verifier: string, challenge: string): boolean {
  if (!VERIFIER.test(verifier) || !CHALLENGE.test(challenge)) return false
  return safeEqual(createHash('sha256').update(verifier).digest('base64url'), challenge)
}

// Só estes endereços podem receber o código: o Claude (web, desktop e celular) e o computador da própria
// pessoa (Claude Code usa localhost com porta qualquer). Um app desconhecido não consegue se registrar
// para receber códigos em outro domínio.
const CALLBACKS_DO_CLAUDE = new Set(['https://claude.ai/api/mcp/auth_callback', 'https://claude.com/api/mcp/auth_callback'])
const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]'])

export function redirectUriPermitida(uri: unknown): uri is string {
  if (typeof uri !== 'string' || uri.length > 300) return false
  if (CALLBACKS_DO_CLAUDE.has(uri)) return true
  let u: URL
  try {
    u = new URL(uri)
  } catch {
    return false
  }
  return u.protocol === 'http:' && LOOPBACK.has(u.hostname) && !u.username && !u.password && !u.hash
}

// Nome mostrado na tela de permissão, em Família e no cartão de sugestões: texto simples, curto, sem caracteres
// de controle, invisíveis nem de direção do texto.
export function nomeDoApp(raw: unknown): string {
  const s = typeof raw === 'string' ? raw.replace(/[\p{Cc}\p{Cf}<>]/gu, ' ').replace(/\s+/g, ' ').trim() : ''
  return s.slice(0, 60) || 'Aplicativo'
}

// Quem se registra escolhe o próprio nome. Para quem volta ao endereço do Claude o nome é sempre "Claude":
// ninguém consegue se passar por outro app nem escrever um título enganoso na tela de permissão.
export function nomeDoCliente(raw: unknown, redirectUris: string[]): string {
  if (redirectUris.length > 0 && redirectUris.every((u) => CALLBACKS_DO_CLAUDE.has(u))) return 'Claude'
  return nomeDoApp(raw)
}

// Limite simples por chave, em memória (vale por instância do servidor, como o da ajuda por IA).
export function limitador(max: number, janelaMs: number) {
  const hits = new Map<string, number[]>()
  return (chave: string): boolean => {
    const agora = Date.now()
    const recentes = (hits.get(chave) ?? []).filter((t) => agora - t < janelaMs)
    const estourou = recentes.length >= max
    if (!estourou) recentes.push(agora)
    hits.set(chave, recentes)
    if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => agora - t < janelaMs)) hits.delete(k)
    return estourou
  }
}

export function ipDe(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'desconhecido'
}

// Metadados e endpoints sem cookie podem ser lidos de qualquer origem (o Claude consulta pelo servidor,
// mas ferramentas no navegador, como o MCP Inspector, também).
export const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Mcp-Protocol-Version, Mcp-Session-Id, Last-Event-ID',
  'Access-Control-Expose-Headers': 'WWW-Authenticate, Mcp-Session-Id',
  'Access-Control-Max-Age': '86400',
}

export function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...CORS, 'Cache-Control': 'no-store', ...extra } })
}

export const preflight = () => new Response(null, { status: 204, headers: CORS })

// Erro de OAuth no formato do RFC 6749.
export function oauthError(error: string, description: string, status = 400) {
  return json({ error, error_description: description }, status)
}

// Pedido de autorização já validado (o mesmo formato vai na tela de permissão e no envio do formulário).
export type PedidoAuth = {
  clientId: string
  redirectUri: string
  codeChallenge: string
  state: string
}

export const CAMPOS_PEDIDO = ['client_id', 'redirect_uri', 'code_challenge', 'code_challenge_method', 'response_type', 'state', 'resource'] as const

// Valida o que dá para validar sem banco. Erros aqui NUNCA redirecionam (o endereço ainda não é confiável).
export function validarPedido(p: URLSearchParams | FormData, resource: string): { ok: true; pedido: PedidoAuth } | { ok: false } {
  const get = (k: string) => {
    const v = p.get(k)
    return typeof v === 'string' ? v : ''
  }
  const redirectUri = get('redirect_uri')
  const clientId = get('client_id')
  const challenge = get('code_challenge')
  const state = get('state')
  const reqResource = get('resource')
  if (!clientId || clientId.length > 100) return { ok: false }
  if (!redirectUriPermitida(redirectUri)) return { ok: false }
  if (get('response_type') !== 'code') return { ok: false }
  if (get('code_challenge_method') !== 'S256' || !CHALLENGE.test(challenge)) return { ok: false }
  if (state.length > 500) return { ok: false }
  if (reqResource && reqResource.replace(/\/+$/, '') !== resource) return { ok: false }
  return { ok: true, pedido: { clientId, redirectUri, codeChallenge: challenge, state } }
}
