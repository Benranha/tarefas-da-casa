import { NextResponse } from 'next/server'
import { getFamily } from '@/lib/auth/server'
import { UUID, badRequest, conflict, unauthorized } from '@/lib/http'
import { markInstanceDone } from '@/lib/instances'

// Os pais marcam a tarefa como feita pela criança (vai para "aguardando aprovação").
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const { id } = await params
  if (!UUID.test(id)) return badRequest()

  const done = await markInstanceDone(family.ownerId, id)
  return done ? NextResponse.json({ ok: true }) : conflict('Tarefa não está pendente')
}
