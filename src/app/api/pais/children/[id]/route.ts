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
    DELETE FROM children WHERE id = ${id}::uuid AND owner_id = ${family.ownerId}::uuid RETURNING id
  `
  return rows.length ? NextResponse.json({ ok: true }) : notFound()
}
