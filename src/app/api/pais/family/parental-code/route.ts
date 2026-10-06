import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { PIN, badRequest, unauthorized } from '@/lib/http'
import { hashPin } from '@/lib/child-auth'

// Define ou troca o código parental (4 a 8 números).
export async function POST(request: Request) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const body = await request.json().catch(() => ({}))
  const pin = typeof body.pin === 'string' ? body.pin : ''
  if (!PIN.test(pin)) return badRequest('O código precisa ter de 4 a 8 números')
  await sql`
    UPDATE families SET parental_pin_hash = ${hashPin(pin)}, parental_attempts = 0, parental_locked_until = NULL
    WHERE owner_id = ${family.ownerId}::uuid
  `
  return NextResponse.json({ ok: true })
}

// Remove o código (o "Trocar modo" do totem volta a abrir direto).
export async function DELETE() {
  const family = await getFamily()
  if (!family) return unauthorized()
  await sql`UPDATE families SET parental_pin_hash = NULL WHERE owner_id = ${family.ownerId}::uuid`
  return NextResponse.json({ ok: true })
}
