import { after, NextResponse } from 'next/server'
import { getFamily } from '@/lib/auth/server'
import { badRequest, notFound, unauthorized } from '@/lib/http'
import { createTask, listTasks, taskInputFromBody } from '@/lib/tarefas'
import { enviarBoasVindasAgora } from '@/lib/email/rotina'

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
  // Primeira tarefa pronta = onboarding terminado: manda as boas-vindas depois da resposta, sem atrasar
  // o responsável. Só envia uma vez, só para família nova, e só com EMAIL_DICAS=1 (veja email/rotina.ts).
  after(() => enviarBoasVindasAgora(family.ownerId))
  return NextResponse.json({ id: result.id }, { status: 201 })
}
