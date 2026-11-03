import { NextResponse } from 'next/server'
import { getFamily } from '@/lib/auth/server'
import { badRequest, notFound, unauthorized } from '@/lib/http'
import { createTask, listTasks, taskInputFromBody } from '@/lib/tarefas'

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
  const result = await createTask(family.ownerId, taskInputFromBody(body))
  if (!result.ok) return result.status === 404 ? notFound() : badRequest(result.error)
  return NextResponse.json({ id: result.id }, { status: 201 })
}
