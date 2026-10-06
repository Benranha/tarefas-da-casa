import { NextResponse, after } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { UUID, badRequest, unauthorized } from '@/lib/http'
import { notifyChild } from '@/lib/push'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const { id } = await params
  if (!UUID.test(id)) return badRequest()
  const body = await request.json().catch(() => ({}))
  const note =
    typeof body.note === 'string' && body.note.trim()
      ? body.note.trim().slice(0, 300)
      : 'Tarefa precisa de melhorias'

  const rows = await sql`
    UPDATE task_instances ti
    SET status = 'pending', parent_note = ${note}, completed_at = NULL
    FROM children c, tasks t
    WHERE ti.id = ${id}::uuid AND c.id = ti.child_id AND t.id = ti.task_id
      AND c.owner_id = ${family.ownerId}::uuid
      AND ti.status = 'awaiting_approval'
    RETURNING ti.child_id, t.title
  `
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Tarefa não está aguardando aprovação' }, { status: 409 })
  }
  const { child_id: childId, title } = rows[0] as { child_id: string; title: string }
  after(() =>
    notifyChild(childId, {
      title: 'Os papais devolveram uma tarefa',
      body: `${title}: ${note}`,
      url: '/filho',
      tag: `returned-${id}`,
    }),
  )
  return NextResponse.json({ ok: true })
}
