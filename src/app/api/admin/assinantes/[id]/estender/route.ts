import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getAdmin } from '@/lib/admin'
import { UUID, badRequest, notFound, unauthorized } from '@/lib/http'

export const dynamic = 'force-dynamic'

// Estende o teste grátis em 7 dias (a partir do fim atual, ou de agora se já tiver acabado).
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return unauthorized()
  const { id } = await params
  if (!UUID.test(id)) return badRequest()

  const rows = await sql`
    UPDATE families SET trial_ends_at = GREATEST(trial_ends_at, now()) + interval '7 days'
    WHERE owner_id = ${id}::uuid
      AND NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.family_id = families.owner_id AND s.status IN ('active','past_due','canceled'))
    RETURNING owner_id`
  if (!rows.length) return notFound()
  // Teste expirado volta a "em teste" se já havia linha de assinatura.
  await sql`UPDATE subscriptions SET status = 'trialing', updated_at = now() WHERE family_id = ${id}::uuid AND status = 'expired'`
  return NextResponse.json({ ok: true })
}
