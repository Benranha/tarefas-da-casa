import { NextResponse, type NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { CODE, badRequest } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code') ?? ''
  if (!CODE.test(code)) return badRequest('Código inválido')
  const rows = await sql`
    SELECT rw.id, rw.title, rw.icon, rw.cost_points
    FROM rewards rw JOIN families f ON f.owner_id = rw.owner_id
    WHERE f.totem_code = ${code}
    ORDER BY rw.cost_points, rw.created_at
  `
  return NextResponse.json(rows)
}
