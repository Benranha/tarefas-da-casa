import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { UUID, badRequest, notFound, unauthorized } from '@/lib/http'
import { ensureTodayInstances } from '@/lib/instances'
import { todayTasks } from '@/lib/kid'

export const dynamic = 'force-dynamic'

// Tela de uma criança: dados dela + as tarefas de hoje com o estado de cada uma.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const { id } = await params
  if (!UUID.test(id)) return badRequest()

  const rows = await sql`
    SELECT id, name, avatar, color, points,
           to_char(wake_time, 'HH24:MI') AS wake_time, to_char(bed_time, 'HH24:MI') AS bed_time
    FROM children WHERE id = ${id}::uuid AND owner_id = ${family.ownerId}::uuid
  `
  if (rows.length === 0) return notFound()

  await ensureTodayInstances({ childId: id })
  return NextResponse.json({ child: rows[0], tasks: await todayTasks(id) })
}
