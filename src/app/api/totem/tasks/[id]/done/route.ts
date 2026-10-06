import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Público (totem): só permite a transição pending -> awaiting_approval,
// e apenas para tarefas de hoje. Nada além disso.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!UUID.test(id)) {
    return NextResponse.json({ error: 'id inválido' }, { status: 400 })
  }

  const rows = await sql`
    UPDATE task_instances
    SET status = 'awaiting_approval', completed_at = now()
    WHERE id = ${id}::uuid
      AND status = 'pending'
      AND date = (now() at time zone 'America/Manaus')::date
    RETURNING id
  `
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Tarefa não está pendente' }, { status: 409 })
  }
  return NextResponse.json({ ok: true })
}
