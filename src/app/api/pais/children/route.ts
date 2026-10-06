import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { badRequest, unauthorized } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function GET() {
  const family = await getFamily()
  if (!family) return unauthorized()
  const rows = await sql`
    SELECT id, name, avatar, color, points FROM children
    WHERE owner_id = ${family.ownerId}::uuid ORDER BY created_at
  `
  return NextResponse.json(rows)
}

export async function POST(request: Request) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const body = await request.json().catch(() => ({}))
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 40) : ''
  const avatar = typeof body.avatar === 'string' ? body.avatar.trim().slice(0, 8) : '🧒'
  const color = /^#[0-9a-fA-F]{6}$/.test(body.color ?? '') ? body.color : '#3B82F6'
  if (!name) return badRequest('Informe o nome')

  const rows = await sql`
    INSERT INTO children (owner_id, name, avatar, color)
    VALUES (${family.ownerId}::uuid, ${name}, ${avatar || '🧒'}, ${color})
    RETURNING id, name, avatar, color, points
  `
  return NextResponse.json(rows[0], { status: 201 })
}
