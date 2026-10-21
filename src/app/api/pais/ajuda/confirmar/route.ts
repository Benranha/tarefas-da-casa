import { NextResponse } from 'next/server'
import { getFamily } from '@/lib/auth/server'
import { badRequest, notFound, unauthorized } from '@/lib/http'
import { createTask } from '@/lib/tarefas'

export const dynamic = 'force-dynamic'

// Executa a proposta da IA depois que o responsável clicou em "Confirmar".
// Os dados são validados de novo, com as mesmas regras de criar tarefa pelo painel.
export async function POST(request: Request) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const body = await request.json().catch(() => ({}))
  if (body.tool !== 'criar_tarefa') return badRequest()
  const a = body.args ?? {}
  const result = await createTask(family.ownerId, {
    title: typeof a.title === 'string' ? a.title.trim().slice(0, 80) : '',
    points: Number.isInteger(a.points) ? a.points : NaN,
    childId: typeof a.childId === 'string' ? a.childId : '',
    once: a.once === true,
    dueTime: typeof a.dueTime === 'string' && a.dueTime ? a.dueTime : null,
  })
  if (!result.ok) return result.status === 404 ? notFound() : badRequest(result.error)
  return NextResponse.json({ ok: true, message: `Pronto! Criei a tarefa "${a.title}" para ${result.childName}.` }, { status: 201 })
}
