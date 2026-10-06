import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { ensureTodayInstances } from '@/lib/instances'
import { notifyChild } from '@/lib/push'

export const dynamic = 'force-dynamic'

// Lembretes de horário. Chame a cada poucos minutos (Vercel Cron, com CRON_SECRET, ou outro agendador):
// avisa a criança das tarefas pendentes cujo horário já chegou, uma vez por tarefa, e só
// entre a hora de acordar e a de dormir dela.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // Garante as ocorrências de hoje das crianças com aparelho próprio.
  const kids = await sql`SELECT DISTINCT c.id FROM children c JOIN push_subscriptions ps ON ps.child_id = c.id`
  await Promise.all(kids.map((k) => ensureTodayInstances({ childId: k.id as string })))

  const due = await sql`
    UPDATE task_instances ti SET reminded_at = now()
    FROM tasks t, children c
    WHERE t.id = ti.task_id AND c.id = ti.child_id
      AND ti.status = 'pending' AND ti.reminded_at IS NULL
      AND ti.date = (now() at time zone 'America/Manaus')::date
      AND t.due_time IS NOT NULL
      AND t.due_time <= (now() at time zone 'America/Manaus')::time
      AND (now() at time zone 'America/Manaus')::time BETWEEN c.wake_time AND c.bed_time
      AND EXISTS (SELECT 1 FROM push_subscriptions ps WHERE ps.child_id = c.id)
    RETURNING ti.id, ti.child_id, t.title, t.icon
  `
  await Promise.all(
    due.map((d) =>
      notifyChild(d.child_id as string, {
        title: 'Hora da tarefa!',
        body: d.title as string,
        url: '/filho',
        tag: `due-${d.id}`,
      }),
    ),
  )
  return NextResponse.json({ sent: due.length })
}
