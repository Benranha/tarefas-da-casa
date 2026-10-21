import { NextResponse } from 'next/server'
import { getFamily } from '@/lib/auth/server'
import { badRequest, notFound, unauthorized } from '@/lib/http'
import { commitTool } from '@/lib/ajuda-tools'

export const dynamic = 'force-dynamic'

// Executa a proposta da IA depois que o responsável clicou em "Confirmar".
// Os dados são validados de novo pela própria ferramenta, com as mesmas regras do painel.
export async function POST(request: Request) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const body = await request.json().catch(() => ({}))
  if (typeof body.tool !== 'string') return badRequest()
  const args = body.args && typeof body.args === 'object' && !Array.isArray(body.args) ? body.args : {}
  const result = await commitTool(family.ownerId, family.userId, body.tool, args)
  if (!result) return badRequest()
  if (!result.ok) return result.status === 404 ? notFound() : badRequest(result.error)
  return NextResponse.json({ ok: true, message: result.message }, { status: 201 })
}
