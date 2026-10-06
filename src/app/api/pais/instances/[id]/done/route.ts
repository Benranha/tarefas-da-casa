import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { UUID, badRequest, conflict, unauthorized } from '@/lib/http'

// Os pais marcam a tarefa como feita pela criança (vai para "aguardando aprovação").
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const { id } = await params
  if (!UUID.test(id)) return badRequest()

  const rows = await sql`
    UPDATE task_instances ti
    SET status = 'awaiting_approval', completed_at = now(), parent_note = NULL
    FROM children c
    WHERE ti.id = ${id}::uuid AND c.id = ti.child_id
      AND c.owner_id = ${family.ownerId}::uuid
      AND ti.status = 'pending'
    RETURNING ti.id
  `
  return rows.length ? NextResponse.json({ ok: true }) : conflict('Tarefa não está pendente')
}
