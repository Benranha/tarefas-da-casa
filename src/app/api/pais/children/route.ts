import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { TIME, badRequest, unauthorized } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function GET() {
  const family = await getFamily()
  if (!family) return unauthorized()
  const rows = await sql`
    SELECT id, name, avatar, color, points, has_device, invite_code,
           (pin_hash IS NOT NULL) AS has_pin,
           to_char(wake_time, 'HH24:MI') AS wake_time, to_char(bed_time, 'HH24:MI') AS bed_time
    FROM children
    WHERE owner_id = ${family.ownerId}::uuid ORDER BY created_at
  `
  return NextResponse.json(rows)
}

export async function POST(request: Request) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const body = await request.json().catch(() => ({}))
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 40) : ''
  const avatar = typeof body.avatar === 'string' ? body.avatar.trim().slice(0, 24) : 'menino'
  const color = /^#[0-9a-fA-F]{6}$/.test(body.color ?? '') ? body.color : '#2F5BEA'
  const wake = TIME.test(body.wakeTime ?? '') ? body.wakeTime : '07:00'
  const bed = TIME.test(body.bedTime ?? '') ? body.bedTime : '21:00'
  const hasDevice = body.hasDevice === true
  if (!name) return badRequest('Informe o nome')

  const rows = await sql`
    INSERT INTO children (owner_id, name, avatar, color, wake_time, bed_time, has_device)
    VALUES (${family.ownerId}::uuid, ${name}, ${avatar || '🧒'}, ${color}, ${wake}::time, ${bed}::time, ${hasDevice})
    RETURNING id, name, avatar, color, points, has_device, invite_code,
              false AS has_pin,
              to_char(wake_time, 'HH24:MI') AS wake_time, to_char(bed_time, 'HH24:MI') AS bed_time
  `
  return NextResponse.json(rows[0], { status: 201 })
}
