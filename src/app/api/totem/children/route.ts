import { NextResponse, type NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { CODE, badRequest } from '@/lib/http'

export const dynamic = 'force-dynamic'

// Crianças da família dona do código do totem. Nunca expõe PIN.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code') ?? ''
  if (!CODE.test(code)) return badRequest('Código inválido')

  const rows = await sql`
    SELECT c.id, c.name, c.avatar, c.color, c.points
    FROM children c JOIN families f ON f.owner_id = c.owner_id
    WHERE f.totem_code = ${code}
    ORDER BY c.created_at
  `
  return NextResponse.json(rows)
}
