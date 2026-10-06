import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { TIME, UUID, badRequest, notFound, unauthorized } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function GET() {
  const family = await getFamily()
  if (!family) return unauthorized()
  const rows = await sql`
    SELECT t.id, t.title, t.description, t.icon, t.points, t.recurrence, t.assigned_child_id,
           to_char(t.due_time, 'HH24:MI') AS due_time, c.name AS child_name
    FROM tasks t JOIN children c ON c.id = t.assigned_child_id
    WHERE c.owner_id = ${family.ownerId}::uuid AND t.active
    ORDER BY c.created_at, t.due_time NULLS LAST, t.created_at
  `
  return NextResponse.json(rows)
}

export async function POST(request: Request) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const body = await request.json().catch(() => ({}))
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 80) : ''
  const description = typeof body.description === 'string' ? body.description.trim().slice(0, 500) : ''
  const icon = typeof body.icon === 'string' ? body.icon.trim().slice(0, 24) : 'brilho'
  const points = Number.isInteger(body.points) ? body.points : NaN
  const childId = typeof body.childId === 'string' ? body.childId : ''
  const dueTime = typeof body.dueTime === 'string' && body.dueTime ? body.dueTime : null
  if (!title || !(points >= 0 && points <= 1000) || !UUID.test(childId)) {
    return badRequest('Informe tarefa, pontos e criança')
  }
  if (dueTime && !TIME.test(dueTime)) return badRequest('Horário inválido')

  // Só aceita criança da própria família, e o horário precisa caber entre acordar e dormir.
  const kid = await sql`
    SELECT to_char(wake_time, 'HH24:MI') AS wake, to_char(bed_time, 'HH24:MI') AS bed
    FROM children WHERE id = ${childId}::uuid AND owner_id = ${family.ownerId}::uuid
  `
  if (kid.length === 0) return notFound()
  if (dueTime && kid[0].wake < kid[0].bed && (dueTime < kid[0].wake || dueTime > kid[0].bed)) {
    return badRequest(`O horário precisa ficar entre ${kid[0].wake} (acordar) e ${kid[0].bed} (dormir)`)
  }

  const rows = await sql`
    INSERT INTO tasks (title, description, icon, points, assigned_child_id, recurrence, due_time)
    VALUES (${title}, ${description || null}, ${icon || 'brilho'}, ${points}, ${childId}::uuid, 'daily', ${dueTime}::time)
    RETURNING id
  `
  return NextResponse.json(rows[0], { status: 201 })
}
