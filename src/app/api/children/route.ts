import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Público (totem). Nunca expõe o PIN.
export async function GET() {
  const rows = await sql`
    SELECT id, name, avatar, color, points FROM children ORDER BY created_at
  `
  return NextResponse.json(rows)
}
