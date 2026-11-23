import { NextResponse } from 'next/server'
import { getFamily } from '@/lib/auth/server'
import { UUID, badRequest, notFound, unauthorized } from '@/lib/http'
import { desconectar } from '@/lib/mcp/store'

export const dynamic = 'force-dynamic'

// Desconectar: o app perde o acesso na hora. Cada responsável só desconecta as próprias conexões.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const { id } = await params
  if (!UUID.test(id)) return badRequest()
  if (!(await desconectar(family.userId, id))) return notFound()
  return NextResponse.json({ ok: true })
}
