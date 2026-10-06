import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { unauthorized } from '@/lib/http'

// Novo convite (vale 7 dias, uma pessoa só) para outro pai/mãe entrar na família.
export async function POST() {
  const family = await getFamily()
  if (!family) return unauthorized()
  const rows = await sql`
    INSERT INTO family_invites (family_owner_id, created_by)
    VALUES (${family.ownerId}::uuid, ${family.userId}::uuid)
    RETURNING code, expires_at
  `
  return NextResponse.json(rows[0], { status: 201 })
}
