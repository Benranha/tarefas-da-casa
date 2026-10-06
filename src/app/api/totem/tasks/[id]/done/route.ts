import { NextResponse, after, type NextRequest } from 'next/server'
import { UUID, badRequest, conflict, unauthorized } from '@/lib/http'
import { childForTotem, markDone } from '@/lib/kid'
import { notifyParents } from '@/lib/push'

// Público (totem): só a transição pending -> awaiting_approval, só para tarefas de hoje
// e só da criança que entrou com o código dela.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID.test(id)) return badRequest()
  const child = await childForTotem(request)
  if (!child) return unauthorized()

  const done = await markDone(id, child.id)
  if (!done) return conflict('Tarefa não está pendente')
  after(() =>
    notifyParents(done.owner_id, {
      title: `${done.child_name} terminou uma tarefa`,
      body: `${done.title} está esperando sua aprovação.`,
      url: '/pais',
      tag: `done-${id}`,
    }),
  )
  return NextResponse.json({ ok: true })
}
