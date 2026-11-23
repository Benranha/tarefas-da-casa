import { NextResponse } from 'next/server'
import { getFamily } from '@/lib/auth/server'
import { UUID, badRequest, unauthorized } from '@/lib/http'
import { decidirSugestao } from '@/lib/mcp/propostas'

export const dynamic = 'force-dynamic'

// O responsável tocou em Confirmar ou Recusar numa sugestão do Claude. É aqui, e só aqui, que ela vira ação.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const { id } = await params
  if (!UUID.test(id)) return badRequest()
  const body = await request.json().catch(() => ({}))
  if (body?.acao !== 'confirmar' && body?.acao !== 'recusar') return badRequest()

  const r = await decidirSugestao(family.ownerId, family.userId, id, body.acao)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status })
  return NextResponse.json({ ok: true, message: r.message })
}
