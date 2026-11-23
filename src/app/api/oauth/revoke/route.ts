import { ipDe, json, limitador, preflight } from '@/lib/mcp/oauth'
import { revogarPorToken } from '@/lib/mcp/store'

export const dynamic = 'force-dynamic'

const muitos = limitador(60, 10 * 60_000)

// RFC 7009: o app pede para encerrar a conexão. Responde 200 mesmo se o token não existir.
export async function POST(request: Request) {
  if (muitos(ipDe(request))) return json({ error: 'temporarily_unavailable' }, 429)
  const texto = await request.text().catch(() => '')
  const p = new URLSearchParams(texto.length <= 10_000 ? texto : '')
  const token = p.get('token')
  const clientId = p.get('client_id')
  if (token && clientId) await revogarPorToken(token, clientId)
  return json({})
}

export const OPTIONS = preflight
