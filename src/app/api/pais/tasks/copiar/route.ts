import { NextResponse } from 'next/server'
import { getFamily } from '@/lib/auth/server'
import { badRequest, notFound, unauthorized } from '@/lib/http'
import { copyTasks } from '@/lib/tarefas'

// Copia tarefas de uma criança para outra: { fromChildId, toChildId, taskIds? } (sem taskIds = todas).
export async function POST(request: Request) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const body = await request.json().catch(() => ({}))
  const taskIds = Array.isArray(body.taskIds)
    ? body.taskIds.filter((x: unknown): x is string => typeof x === 'string')
    : undefined
  const result = await copyTasks(
    family.ownerId,
    typeof body.fromChildId === 'string' ? body.fromChildId : '',
    typeof body.toChildId === 'string' ? body.toChildId : '',
    taskIds,
  )
  if (!result.ok) return result.status === 404 ? notFound() : badRequest(result.error)
  return NextResponse.json({ copied: result.copied, skipped: result.skipped })
}
