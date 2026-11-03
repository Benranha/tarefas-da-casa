import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { UUID, badRequest, notFound, unauthorized } from '@/lib/http'
import { taskInputFromBody, updateTask } from '@/lib/tarefas'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const { id } = await params
  if (!UUID.test(id)) return badRequest()
  const rows = await sql`
    DELETE FROM tasks t USING children c
    WHERE t.id = ${id}::uuid AND c.id = t.assigned_child_id
      AND c.owner_id = ${family.ownerId}::uuid
    RETURNING t.id
  `
  return rows.length ? NextResponse.json({ ok: true }) : notFound()
}

// Edição completa da tarefa (título, ícone, pontos, criança, horário, descrição e dias).
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const { id } = await params
  if (!UUID.test(id)) return badRequest()
  const body = await request.json().catch(() => ({}))
  const result = await updateTask(family.ownerId, id, taskInputFromBody(body))
  if (!result.ok) return result.status === 404 ? notFound() : badRequest(result.error)
  return NextResponse.json({ ok: true })
}
