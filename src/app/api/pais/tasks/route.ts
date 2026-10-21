import { NextResponse } from 'next/server'
import { getFamily } from '@/lib/auth/server'
import { badRequest, notFound, unauthorized } from '@/lib/http'
import { createTask, listTasks } from '@/lib/tarefas'

export const dynamic = 'force-dynamic'

export async function GET() {
  const family = await getFamily()
  if (!family) return unauthorized()
  return NextResponse.json(await listTasks(family.ownerId))
}

export async function POST(request: Request) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const body = await request.json().catch(() => ({}))
  const result = await createTask(family.ownerId, {
    title: typeof body.title === 'string' ? body.title.trim().slice(0, 80) : '',
    description: typeof body.description === 'string' ? body.description.trim().slice(0, 500) : '',
    icon: typeof body.icon === 'string' ? body.icon.trim().slice(0, 24) : 'brilho',
    points: Number.isInteger(body.points) ? body.points : NaN,
    childId: typeof body.childId === 'string' ? body.childId : '',
    once: body.recurrence === 'none',
    dueTime: typeof body.dueTime === 'string' && body.dueTime ? body.dueTime : null,
  })
  if (!result.ok) return result.status === 404 ? notFound() : badRequest(result.error)
  return NextResponse.json({ id: result.id }, { status: 201 })
}
