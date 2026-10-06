import { NextResponse, after } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { UUID, badRequest, unauthorized } from '@/lib/http'
import { notifyChild } from '@/lib/push'

// Aprova e credita os pontos numa única instrução (atômico), só da própria família.
// Vale para a tarefa que a criança marcou (awaiting_approval) e também para os pais
// aprovarem direto uma tarefa que ainda estava pendente ("feita e aprovada").
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const { id } = await params
  if (!UUID.test(id)) return badRequest()

  const rows = await sql`
    WITH approved AS (
      UPDATE task_instances ti
      SET status = 'approved', approved_at = now(), approved_by = ${family.userId}::uuid,
          completed_at = COALESCE(ti.completed_at, now()), parent_note = NULL
      FROM children c
      WHERE ti.id = ${id}::uuid AND c.id = ti.child_id
        AND c.owner_id = ${family.ownerId}::uuid
        AND ti.status IN ('awaiting_approval', 'pending')
      RETURNING ti.child_id, ti.task_id
    )
    UPDATE children c
    SET points = c.points + t.points
    FROM approved a JOIN tasks t ON t.id = a.task_id
    WHERE c.id = a.child_id
    RETURNING c.id, t.title, t.points
  `
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Tarefa não pode ser aprovada agora' }, { status: 409 })
  }
  const { id: childId, title, points } = rows[0] as { id: string; title: string; points: number }
  after(() =>
    notifyChild(childId, {
      title: 'Tarefa aprovada!',
      body: `${title}${points ? ` (+${points} pontos)` : ''}`,
      url: '/filho',
      tag: `approved-${id}`,
    }),
  )
  return NextResponse.json({ ok: true })
}
