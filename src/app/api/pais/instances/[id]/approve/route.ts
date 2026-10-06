import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getParent } from '@/lib/auth/server'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const parent = await getParent()
  if (!parent) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
  const { id } = await params
  if (!UUID.test(id)) {
    return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  }

  // Aprova e credita os pontos numa única instrução (atômico, sem dupla contagem).
  const rows = await sql`
    WITH approved AS (
      UPDATE task_instances
      SET status = 'approved', approved_at = now(), approved_by = ${parent.id}::uuid
      WHERE id = ${id}::uuid AND status = 'awaiting_approval'
      RETURNING child_id, task_id
    )
    UPDATE children c
    SET points = c.points + t.points
    FROM approved a JOIN tasks t ON t.id = a.task_id
    WHERE c.id = a.child_id
    RETURNING c.id
  `
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Tarefa não está aguardando aprovação' }, { status: 409 })
  }
  return NextResponse.json({ ok: true })
}
