import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getParent } from '@/lib/auth/server'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getParent())) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
  const { id } = await params
  if (!UUID.test(id)) {
    return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  }
  const body = await request.json().catch(() => ({}))
  const note =
    typeof body.note === 'string' && body.note.trim()
      ? body.note.trim().slice(0, 300)
      : 'Tarefa precisa de melhorias'

  const rows = await sql`
    UPDATE task_instances
    SET status = 'pending', parent_note = ${note}, completed_at = NULL
    WHERE id = ${id}::uuid AND status = 'awaiting_approval'
    RETURNING id
  `
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Tarefa não está aguardando aprovação' }, { status: 409 })
  }
  return NextResponse.json({ ok: true })
}
