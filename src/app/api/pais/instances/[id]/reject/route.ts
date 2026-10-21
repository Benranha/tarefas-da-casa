import { NextResponse } from 'next/server'
import { getFamily } from '@/lib/auth/server'
import { UUID, badRequest, unauthorized } from '@/lib/http'
import { rejectInstance } from '@/lib/instances'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const { id } = await params
  if (!UUID.test(id)) return badRequest()
  const body = await request.json().catch(() => ({}))
  const note =
    typeof body.note === 'string' && body.note.trim()
      ? body.note.trim().slice(0, 300)
      : 'Tarefa precisa de melhorias'

  const rejected = await rejectInstance(family.ownerId, id, note)
  if (!rejected) return NextResponse.json({ error: 'Tarefa não está aguardando aprovação' }, { status: 409 })
  return NextResponse.json({ ok: true })
}
