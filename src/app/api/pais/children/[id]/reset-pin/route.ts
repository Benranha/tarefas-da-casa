import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { UUID, badRequest, notFound, unauthorized } from '@/lib/http'

// Esqueceu o código? Os pais apagam e a criança escolhe outro na próxima entrada.
// Os acessos já abertos deixam de valer (o token é amarrado ao código).
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const { id } = await params
  if (!UUID.test(id)) return badRequest()
  const rows = await sql`
    UPDATE children SET pin_hash = NULL, pin_attempts = 0, pin_locked_until = NULL
    WHERE id = ${id}::uuid AND owner_id = ${family.ownerId}::uuid RETURNING id
  `
  return rows.length ? NextResponse.json({ ok: true }) : notFound()
}
