import { NextResponse } from 'next/server'
import { getFamily } from '@/lib/auth/server'
import { UUID, badRequest, unauthorized } from '@/lib/http'
import { deliverRedemption } from '@/lib/recompensas'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const { id } = await params
  if (!UUID.test(id)) return badRequest()

  const delivered = await deliverRedemption(family.ownerId, id)
  if (!delivered) return NextResponse.json({ error: 'Pedido não está aguardando' }, { status: 409 })
  return NextResponse.json({ ok: true })
}
