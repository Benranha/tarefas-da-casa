import { NextResponse } from 'next/server'
import { UUID, badRequest, conflict, unauthorized } from '@/lib/http'
import { childForDevice, redeemReward } from '@/lib/kid'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID.test(id)) return badRequest()
  const child = await childForDevice(request)
  if (!child) return unauthorized()

  const redeemed = await redeemReward(id, child)
  if (!redeemed) return conflict('Pontos insuficientes')
  return NextResponse.json({ ok: true, points: redeemed.points })
}
