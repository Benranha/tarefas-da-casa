import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { UUID, badRequest, notFound, unauthorized } from '@/lib/http'

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
