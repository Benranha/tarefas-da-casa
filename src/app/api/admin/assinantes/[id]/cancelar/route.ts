import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getAdmin } from '@/lib/admin'
import { UUID, badRequest, notFound, unauthorized } from '@/lib/http'

export const dynamic = 'force-dynamic'

// Marca a assinatura como cancelada. A cobrança no gateway deve ser encerrada por lá.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return unauthorized()
  const { id } = await params
  if (!UUID.test(id)) return badRequest()

  const rows = await sql`
    INSERT INTO subscriptions (family_id, status, canceled_at)
    SELECT owner_id, 'canceled', now() FROM families WHERE owner_id = ${id}::uuid
    ON CONFLICT (family_id) DO UPDATE SET status = 'canceled', canceled_at = now(), updated_at = now()
    RETURNING family_id`
  if (!rows.length) return notFound()
  return NextResponse.json({ ok: true })
}
