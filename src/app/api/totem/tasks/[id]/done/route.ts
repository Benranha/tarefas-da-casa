import { NextResponse, type NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { CODE, UUID, badRequest } from '@/lib/http'

// Público (totem): só a transição pending -> awaiting_approval, só para tarefas
// de hoje e só da família dona do código.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const code = request.nextUrl.searchParams.get('code') ?? ''
  if (!UUID.test(id) || !CODE.test(code)) return badRequest()

  const rows = await sql`
    UPDATE task_instances ti
    SET status = 'awaiting_approval', completed_at = now()
    FROM children c JOIN families f ON f.owner_id = c.owner_id
    WHERE ti.id = ${id}::uuid
      AND c.id = ti.child_id
      AND f.totem_code = ${code}
      AND ti.status = 'pending'
      AND ti.date = (now() at time zone 'America/Manaus')::date
    RETURNING ti.id
  `
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Tarefa não está pendente' }, { status: 409 })
  }
  return NextResponse.json({ ok: true })
}
