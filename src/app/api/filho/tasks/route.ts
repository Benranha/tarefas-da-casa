import { NextResponse } from 'next/server'
import { unauthorized } from '@/lib/http'
import { ensureTodayInstances } from '@/lib/instances'
import { childForDevice, todayTasks } from '@/lib/kid'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const child = await childForDevice(request)
  if (!child) return unauthorized()
  await ensureTodayInstances({ childId: child.id })
  const me = { id: child.id, name: child.name, avatar: child.avatar, color: child.color, points: child.points, wake_time: child.wake_time, bed_time: child.bed_time }
  return NextResponse.json({ child: me, tasks: await todayTasks(child.id) })
}
