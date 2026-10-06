import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { CHILD_INVITE, PIN, badRequest, notFound } from '@/lib/http'
import { DEVICE_TTL, authenticatePin } from '@/lib/child-auth'

// Link da criança + código: na primeira vez grava o código escolhido, depois confere.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const code = typeof body.c === 'string' ? body.c : ''
  const pin = typeof body.pin === 'string' ? body.pin : ''
  if (!CHILD_INVITE.test(code)) return notFound()
  if (!PIN.test(pin)) return badRequest('O código precisa ter de 4 a 8 números')

  const rows = await sql`SELECT id FROM children WHERE invite_code = ${code} AND has_device`
  if (rows.length === 0) return notFound()

  const result = await authenticatePin(rows[0].id, pin, DEVICE_TTL)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ token: result.token, created: result.created })
}
