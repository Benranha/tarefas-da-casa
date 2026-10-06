import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { TIME, UUID, badRequest, notFound, unauthorized } from '@/lib/http'

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

// Edita horário e descrição. dueTime "" (ou null) tira o horário.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const { id } = await params
  if (!UUID.test(id)) return badRequest()
  const body = await request.json().catch(() => ({}))
  const hasTime = 'dueTime' in body
  const dueTime = typeof body.dueTime === 'string' && body.dueTime ? body.dueTime : null
  const hasDescription = typeof body.description === 'string'
  const description = hasDescription ? body.description.trim().slice(0, 500) || null : null
  if (dueTime && !TIME.test(dueTime)) return badRequest('Horário inválido')

  const kid = await sql`
    SELECT to_char(c.wake_time, 'HH24:MI') AS wake, to_char(c.bed_time, 'HH24:MI') AS bed
    FROM tasks t JOIN children c ON c.id = t.assigned_child_id
    WHERE t.id = ${id}::uuid AND c.owner_id = ${family.ownerId}::uuid
  `
  if (kid.length === 0) return notFound()
  if (dueTime && kid[0].wake < kid[0].bed && (dueTime < kid[0].wake || dueTime > kid[0].bed)) {
    return badRequest(`O horário precisa ficar entre ${kid[0].wake} (acordar) e ${kid[0].bed} (dormir)`)
  }

  await sql`
    UPDATE tasks SET
      due_time = CASE WHEN ${hasTime} THEN ${dueTime}::time ELSE due_time END,
      description = CASE WHEN ${hasDescription} THEN ${description} ELSE description END
    WHERE id = ${id}::uuid
  `
  return NextResponse.json({ ok: true })
}
