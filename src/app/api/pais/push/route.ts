import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { badRequest, unauthorized } from '@/lib/http'
import { parseSubscription } from '@/lib/push'

export async function POST(request: Request) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const sub = parseSubscription(await request.json().catch(() => null))
  if (!sub) return badRequest('Inscrição inválida')
  await sql`
    INSERT INTO push_subscriptions (endpoint, p256dh, auth, user_id)
    VALUES (${sub.endpoint}, ${sub.p256dh}, ${sub.auth}, ${family.userId}::uuid)
    ON CONFLICT (endpoint) DO UPDATE
      SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, user_id = EXCLUDED.user_id, child_id = NULL
  `
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const body = await request.json().catch(() => ({}))
  if (typeof body.endpoint !== 'string') return badRequest()
  await sql`DELETE FROM push_subscriptions WHERE endpoint = ${body.endpoint} AND user_id = ${family.userId}::uuid`
  return NextResponse.json({ ok: true })
}
