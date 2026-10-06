import { NextResponse, type NextRequest } from 'next/server'
import { UUID, badRequest, conflict, unauthorized } from '@/lib/http'
import { childForTotem, redeemReward } from '@/lib/kid'

// Público (totem). Só a criança que entrou com o código dela pede prêmios, com os próprios pontos.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID.test(id)) return badRequest()
  const child = await childForTotem(request)
  if (!child) return unauthorized()

  const redeemed = await redeemReward(id, child)
  if (!redeemed) return conflict('Pontos insuficientes')
  return NextResponse.json({ ok: true, points: redeemed.points })
}
