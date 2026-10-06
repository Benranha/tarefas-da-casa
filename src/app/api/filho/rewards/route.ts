import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { unauthorized } from '@/lib/http'
import { childForDevice } from '@/lib/kid'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const child = await childForDevice(request)
  if (!child) return unauthorized()
  const rows = await sql`
    SELECT id, title, icon, cost_points FROM rewards
    WHERE owner_id = ${child.owner_id}::uuid ORDER BY cost_points, created_at
  `
  return NextResponse.json(rows)
}
