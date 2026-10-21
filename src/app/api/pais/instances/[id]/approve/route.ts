import { NextResponse } from 'next/server'
import { getFamily } from '@/lib/auth/server'
import { UUID, badRequest, unauthorized } from '@/lib/http'
import { approveInstance } from '@/lib/instances'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const { id } = await params
  if (!UUID.test(id)) return badRequest()

  const approved = await approveInstance(family.ownerId, family.userId, id)
  if (!approved) return NextResponse.json({ error: 'Tarefa não pode ser aprovada agora' }, { status: 409 })
  return NextResponse.json({ ok: true })
}
