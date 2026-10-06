import { NextResponse, type NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { CHILD_INVITE, notFound } from '@/lib/http'

export const dynamic = 'force-dynamic'

// Público: o mínimo para a tela de entrada do link da criança (nunca expõe o PIN).
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('c') ?? ''
  if (!CHILD_INVITE.test(code)) return notFound()
  const rows = await sql`
    SELECT name, avatar, color, (pin_hash IS NOT NULL) AS has_pin
    FROM children WHERE invite_code = ${code} AND has_device
  `
  return rows.length ? NextResponse.json(rows[0]) : notFound()
}
