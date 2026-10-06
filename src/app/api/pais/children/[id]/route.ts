import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { TIME, UUID, badRequest, notFound, unauthorized } from '@/lib/http'

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

// Ajustes da criança: horários de acordar e dormir, e se ela tem aparelho próprio.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const { id } = await params
  if (!UUID.test(id)) return badRequest()
  const body = await request.json().catch(() => ({}))
  const wake = TIME.test(body.wakeTime ?? '') ? body.wakeTime : null
  const bed = TIME.test(body.bedTime ?? '') ? body.bedTime : null
  const hasDevice = typeof body.hasDevice === 'boolean' ? body.hasDevice : null
  if (wake && bed && wake >= bed) return badRequest('A hora de acordar precisa ser antes da hora de dormir')

  const rows = await sql`
    UPDATE children SET
      wake_time = COALESCE(${wake}::time, wake_time),
      bed_time = COALESCE(${bed}::time, bed_time),
      has_device = COALESCE(${hasDevice}::boolean, has_device)
    WHERE id = ${id}::uuid AND owner_id = ${family.ownerId}::uuid
    RETURNING id
  `
  return rows.length ? NextResponse.json({ ok: true }) : notFound()
}
