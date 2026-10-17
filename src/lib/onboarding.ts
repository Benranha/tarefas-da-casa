import { sql } from '@/lib/db'

// Onboarding completo = a família tem ao menos uma criança e uma tarefa ativa.
// Se já há criança mas não há tarefa, devolve a criança mais antiga para retomar no passo 2.
export async function onboardingStatus(ownerId: string) {
  const rows = await sql`
    SELECT
      (SELECT id FROM children WHERE owner_id = ${ownerId}::uuid ORDER BY created_at LIMIT 1) AS child_id,
      (SELECT name FROM children WHERE owner_id = ${ownerId}::uuid ORDER BY created_at LIMIT 1) AS child_name,
      EXISTS (
        SELECT 1 FROM tasks t JOIN children c ON c.id = t.assigned_child_id
        WHERE c.owner_id = ${ownerId}::uuid AND t.active
      ) AS has_task
  `
  const r = rows[0]
  const child = r.child_id ? { id: r.child_id as string, name: r.child_name as string } : null
  return { done: !!child && !!r.has_task, child }
}
