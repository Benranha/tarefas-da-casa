import { NextResponse, type NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { CODE } from '@/lib/http'

export const dynamic = 'force-dynamic'

// Diz se um código de totem existe (usado ao configurar o tablet).
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code') ?? ''
  if (!CODE.test(code)) return NextResponse.json({ ok: false })
  const rows = await sql`SELECT 1 FROM families WHERE totem_code = ${code}`
  return NextResponse.json({ ok: rows.length > 0 })
}
