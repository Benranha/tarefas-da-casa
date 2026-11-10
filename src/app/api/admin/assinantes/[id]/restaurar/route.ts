import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getAdmin } from '@/lib/admin'
import { UUID, badRequest, notFound, unauthorized } from '@/lib/http'

export const dynamic = 'force-dynamic'

// Desfaz um cancelamento. Quem já pagava (tem período ou cliente no gateway) volta a 'active'.
// Quem foi cancelado ainda no teste perde a linha e volta a "em teste" ou "teste expirado" pelo trial_ends_at.
// A cobrança no gateway deve ser reativada por lá.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return unauthorized()
  const { id } = await params
  if (!UUID.test(id)) return badRequest()

  const paid = await sql`
    UPDATE subscriptions SET status = 'active', canceled_at = NULL, updated_at = now()
    WHERE family_id = ${id}::uuid AND status = 'canceled'
      AND (current_period_end IS NOT NULL OR provider_customer_id IS NOT NULL)
    RETURNING family_id`
  if (paid.length) return NextResponse.json({ ok: true })

  const trial = await sql`
    DELETE FROM subscriptions WHERE family_id = ${id}::uuid AND status = 'canceled'
    RETURNING family_id`
  if (!trial.length) return notFound()
  return NextResponse.json({ ok: true })
}
