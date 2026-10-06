import { NextResponse, type NextRequest } from 'next/server'
import { CODE, badRequest } from '@/lib/http'
import { parentalRequired, tokenValid, verifyParental } from '@/lib/parental'

export const dynamic = 'force-dynamic'

// Público (totem). GET: o /abrir pergunta se pode reconfigurar o tablet (precisa do token, se houver código).
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code') ?? ''
  const token = request.nextUrl.searchParams.get('t') ?? ''
  if (!CODE.test(code)) return badRequest()
  const required = await parentalRequired(code)
  if (required === null) return NextResponse.json({ required: false, ok: true })
  return NextResponse.json({ required, ok: !required || tokenValid(code, token) })
}

// POST: confere o código parental e devolve o token de 2 minutos.
export async function POST(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code') ?? ''
  const body = await request.json().catch(() => ({}))
  const pin = typeof body.pin === 'string' ? body.pin : ''
  if (!CODE.test(code)) return badRequest()
  const result = await verifyParental(code, pin)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ required: result.required, token: result.token })
}
