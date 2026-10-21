import { sql } from '@/lib/db'
import { TIME, UUID } from '@/lib/http'

// Regras de tarefas compartilhadas entre as rotas HTTP e a IA de ajuda,
// para que a IA nunca contorne a validação do app.

export type TaskInput = {
  title: string
  description?: string
  icon?: string
  points: number
  childId: string
  once?: boolean // tarefa só de hoje (avulsa); o padrão é diária
  dueTime?: string | null
}

export type TaskCheck =
  | { ok: true; childName: string }
  | { ok: false; status: 400 | 404; error: string }

export async function listChildren(ownerId: string) {
  return sql`
    SELECT id, name, points,
           to_char(wake_time, 'HH24:MI') AS wake_time, to_char(bed_time, 'HH24:MI') AS bed_time
    FROM children
    WHERE owner_id = ${ownerId}::uuid ORDER BY created_at
  `
}

export async function listTasks(ownerId: string) {
  return sql`
    SELECT t.id, t.title, t.description, t.icon, t.points, t.recurrence, t.assigned_child_id,
           to_char(t.due_time, 'HH24:MI') AS due_time, c.name AS child_name
    FROM tasks t JOIN children c ON c.id = t.assigned_child_id
    WHERE c.owner_id = ${ownerId}::uuid AND t.active
      -- Tarefa só de hoje ('none') aparece na lista apenas no dia em que foi criada.
      AND (
        t.recurrence <> 'none'
        OR EXISTS (
          SELECT 1 FROM task_instances ti
          WHERE ti.task_id = t.id AND ti.date = (now() at time zone 'America/Manaus')::date
        )
      )
    ORDER BY c.created_at, t.due_time NULLS LAST, t.created_at
  `
}

// Valida sem gravar: pontos, criança da própria família e horário entre acordar e dormir.
export async function checkTask(ownerId: string, input: TaskInput): Promise<TaskCheck> {
  const { title, points, childId, dueTime } = input
  if (!title || !(points >= 0 && points <= 1000) || !UUID.test(childId)) {
    return { ok: false, status: 400, error: 'Informe tarefa, pontos e criança' }
  }
  if (dueTime && !TIME.test(dueTime)) return { ok: false, status: 400, error: 'Horário inválido' }

  const kid = await sql`
    SELECT name, to_char(wake_time, 'HH24:MI') AS wake, to_char(bed_time, 'HH24:MI') AS bed
    FROM children WHERE id = ${childId}::uuid AND owner_id = ${ownerId}::uuid
  `
  if (kid.length === 0) return { ok: false, status: 404, error: 'Não encontrado' }
  if (dueTime && kid[0].wake < kid[0].bed && (dueTime < kid[0].wake || dueTime > kid[0].bed)) {
    return { ok: false, status: 400, error: `O horário precisa ficar entre ${kid[0].wake} (acordar) e ${kid[0].bed} (dormir)` }
  }
  return { ok: true, childName: kid[0].name as string }
}

export async function createTask(ownerId: string, input: TaskInput) {
  const check = await checkTask(ownerId, input)
  if (!check.ok) return check

  const once = input.once === true
  const dueTime = input.dueTime || null
  // Avulsa: cria a tarefa já com a ocorrência de hoje; como não repete, amanhã não gera outra.
  const rows = await sql`
    WITH t AS (
      INSERT INTO tasks (title, description, icon, points, assigned_child_id, recurrence, due_time)
      VALUES (${input.title}, ${input.description || null}, ${input.icon || 'brilho'}, ${input.points}, ${input.childId}::uuid,
              ${once ? 'none' : 'daily'}, ${dueTime}::time)
      RETURNING id, assigned_child_id
    ),
    i AS (
      INSERT INTO task_instances (task_id, child_id, date)
      SELECT id, assigned_child_id, (now() at time zone 'America/Manaus')::date FROM t WHERE ${once}::boolean
      RETURNING id
    )
    SELECT id FROM t
  `
  return { ok: true as const, id: rows[0].id as string, childName: check.childName }
}
