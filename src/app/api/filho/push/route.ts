import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { badRequest, unauthorized } from '@/lib/http'
import { childForDevice } from '@/lib/kid'
import { parseSubscription } from '@/lib/push'

export async function POST(request: Request) {
  const child = await childForDevice(request)
  if (!child) return unauthorized()
  const sub = parseSubscription(await request.json().catch(() => null))
  if (!sub) return badRequest('Inscrição inválida')
  await sql`
    INSERT INTO push_subscriptions (endpoint, p256dh, auth, child_id)
    VALUES (${sub.endpoint}, ${sub.p256dh}, ${sub.auth}, ${child.id}::uuid)
    ON CONFLICT (endpoint) DO UPDATE
      SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, child_id = EXCLUDED.child_id, user_id = NULL
  `
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const child = await childForDevice(request)
  if (!child) return unauthorized()
  const body = await request.json().catch(() => ({}))
  if (typeof body.endpoint !== 'string') return badRequest()
  await sql`DELETE FROM push_subscriptions WHERE endpoint = ${body.endpoint} AND child_id = ${child.id}::uuid`
  return NextResponse.json({ ok: true })
}
