import { NextResponse } from 'next/server'
import { unauthorized } from '@/lib/http'
import { ensureTodayInstances } from '@/lib/instances'
import { childForDevice, createOwnTask, todayTasks } from '@/lib/kid'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const child = await childForDevice(request)
  if (!child) return unauthorized()
  await ensureTodayInstances({ childId: child.id })
  const me = { id: child.id, name: child.name, avatar: child.avatar, color: child.color, points: child.points, wake_time: child.wake_time, bed_time: child.bed_time }
  return NextResponse.json({ child: me, tasks: await todayTasks(child.id) })
}

// A criança adiciona uma tarefa só de hoje para ela mesma. Sem pontos: os pais decidem depois.
export async function POST(request: Request) {
  const child = await childForDevice(request)
  if (!child) return unauthorized()
  const body = await request.json().catch(() => ({}))
  const result = await createOwnTask(child, {
    title: typeof body.title === 'string' ? body.title : '',
    icon: typeof body.icon === 'string' ? body.icon : undefined,
  })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ id: result.id }, { status: 201 })
}
