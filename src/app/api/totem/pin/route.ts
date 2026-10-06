import { NextResponse, type NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { CODE, PIN, UUID, badRequest, notFound } from '@/lib/http'
import { TOTEM_TTL, authenticatePin } from '@/lib/child-auth'

// Público (totem): a criança escolhe o código na primeira vez e depois digita para entrar.
// Devolve o token que vale só para ela.
export async function POST(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code') ?? ''
  const body = await request.json().catch(() => ({}))
  const childId = typeof body.childId === 'string' ? body.childId : ''
  const pin = typeof body.pin === 'string' ? body.pin : ''
  if (!CODE.test(code) || !UUID.test(childId)) return badRequest()
  if (!PIN.test(pin)) return badRequest('O código precisa ter de 4 a 8 números')

  const owned = await sql`
    SELECT 1 FROM children c JOIN families f ON f.owner_id = c.owner_id
    WHERE c.id = ${childId}::uuid AND f.totem_code = ${code}
  `
  if (owned.length === 0) return notFound()

  const result = await authenticatePin(childId, pin, TOTEM_TTL)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ token: result.token, created: result.created })
}
