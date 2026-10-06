import { NextResponse, type NextRequest } from 'next/server'
import { unauthorized } from '@/lib/http'
import { ensureTodayInstances } from '@/lib/instances'
import { childForTotem, todayTasks } from '@/lib/kid'

export const dynamic = 'force-dynamic'

// Tarefas de hoje da criança que entrou com o código dela. Cria as ocorrências
// do dia a partir das tarefas ativas (diárias, ou semanais no dia de hoje).
export async function GET(request: NextRequest) {
  const child = await childForTotem(request)
  if (!child) return unauthorized()
  await ensureTodayInstances({ childId: child.id })
  return NextResponse.json(await todayTasks(child.id))
}
