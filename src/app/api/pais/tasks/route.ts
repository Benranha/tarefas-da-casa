import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { UUID, badRequest, notFound, unauthorized } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function GET() {
  const family = await getFamily()
  if (!family) return unauthorized()
  const rows = await sql`
    SELECT t.id, t.title, t.icon, t.points, t.recurrence, t.assigned_child_id,
           c.name AS child_name
    FROM tasks t JOIN children c ON c.id = t.assigned_child_id
    WHERE c.owner_id = ${family.ownerId}::uuid AND t.active
    ORDER BY t.created_at
  `
  return NextResponse.json(rows)
}

export async function POST(request: Request) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const body = await request.json().catch(() => ({}))
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 80) : ''
  const icon = typeof body.icon === 'string' ? body.icon.trim().slice(0, 8) : '✨'
  const points = Number.isInteger(body.points) ? body.points : NaN
  const childId = typeof body.childId === 'string' ? body.childId : ''
  if (!title || !(points >= 0 && points <= 1000) || !UUID.test(childId)) {
    return badRequest('Informe tarefa, pontos e criança')
  }

  // Só aceita criança da própria família.
  const rows = await sql`
    INSERT INTO tasks (title, icon, points, assigned_child_id, recurrence)
    SELECT ${title}, ${icon || '✨'}, ${points}, c.id, 'daily'
    FROM children c WHERE c.id = ${childId}::uuid AND c.owner_id = ${family.ownerId}::uuid
    RETURNING id
  `
  return rows.length ? NextResponse.json(rows[0], { status: 201 }) : notFound()
}
