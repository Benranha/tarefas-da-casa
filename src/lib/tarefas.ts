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
  days?: string[] // dias da semana (mon..sun); vazio/todos = diária
  dueTime?: string | null
}

export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

// Normaliza a lista de dias: só valores válidos, sem repetir, na ordem da semana.
// Sete dias (ou nenhum) equivale a "todo dia", então devolve null.
export function normalizeDays(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null
  const set = new Set(raw.filter((d): d is string => typeof d === 'string'))
  const days = WEEKDAYS.filter((d) => set.has(d))
  return days.length === 0 || days.length === 7 ? null : [...days]
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
    SELECT t.id, t.title, t.description, t.icon, t.points, t.recurrence, t.recurrence_days, t.assigned_child_id,
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
export async function checkTask(ownerId: string, input: TaskInput, excludeTaskId?: string): Promise<TaskCheck> {
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
  // Mesma tarefa (mesma criança e mesmo nome) em dias que se sobrepõem apareceria duas vezes no mesmo dia.
  // Natação na segunda e na quarta + natação na terça é permitido; diária + qualquer dia, não.
  if (!input.once) {
    const days = normalizeDays(input.days)
    const dup = await sql`
      SELECT 1 FROM tasks
      WHERE assigned_child_id = ${childId}::uuid AND active AND recurrence <> 'none'
        AND lower(btrim(title)) = lower(btrim(${title}))
        AND (${excludeTaskId ?? null}::uuid IS NULL OR id <> ${excludeTaskId ?? null}::uuid)
        AND (
          ${days === null}::boolean OR recurrence = 'daily' OR recurrence_days IS NULL
          OR recurrence_days && ${days ?? []}::text[]
        )
      LIMIT 1
    `
    if (dup.length > 0) {
      return { ok: false, status: 400, error: `${kid[0].name} já tem uma tarefa chamada "${title}" nesses dias` }
    }
  }
  return { ok: true, childName: kid[0].name as string }
}

export async function createTask(ownerId: string, input: TaskInput) {
  const check = await checkTask(ownerId, input)
  if (!check.ok) return check

  const once = input.once === true
  const days = once ? null : normalizeDays(input.days)
  const recurrence = once ? 'none' : days ? 'weekly' : 'daily'
  const dueTime = input.dueTime || null
  // Avulsa: cria a tarefa já com a ocorrência de hoje; como não repete, amanhã não gera outra.
  const rows = await sql`
    WITH t AS (
      INSERT INTO tasks (title, description, icon, points, assigned_child_id, recurrence, recurrence_days, due_time)
      VALUES (${input.title}, ${input.description || null}, ${input.icon || 'brilho'}, ${input.points}, ${input.childId}::uuid,
              ${recurrence}, ${days}::text[], ${dueTime}::time)
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

// Edição completa: título, ícone, pontos, criança, horário, descrição e dias. Valida como na criação.
export async function updateTask(ownerId: string, id: string, input: TaskInput) {
  const cur = await sql`
    SELECT t.assigned_child_id FROM tasks t JOIN children c ON c.id = t.assigned_child_id
    WHERE t.id = ${id}::uuid AND c.owner_id = ${ownerId}::uuid
  `
  if (cur.length === 0) return { ok: false as const, status: 404 as const, error: 'Não encontrado' }
  const check = await checkTask(ownerId, input, id)
  if (!check.ok) return check

  const once = input.once === true
  const days = once ? null : normalizeDays(input.days)
  const recurrence = once ? 'none' : days ? 'weekly' : 'daily'
  const moved = cur[0].assigned_child_id !== input.childId
  await sql`
    WITH moved AS (
      -- Trocou de criança: as ocorrências ainda não feitas saem da antiga (as aprovadas ficam no histórico dela).
      DELETE FROM task_instances WHERE task_id = ${id}::uuid AND status = 'pending' AND ${moved}::boolean
    ),
    upd AS (
      UPDATE tasks SET title = ${input.title}, description = ${input.description || null},
             icon = ${input.icon || 'brilho'}, points = ${input.points}, assigned_child_id = ${input.childId}::uuid,
             recurrence = ${recurrence}, recurrence_days = ${days}::text[], due_time = ${input.dueTime || null}::time
      WHERE id = ${id}::uuid
      RETURNING id, assigned_child_id
    )
    -- Virou "só hoje": garante a ocorrência de hoje, senão a tarefa sumiria da lista.
    INSERT INTO task_instances (task_id, child_id, date)
    SELECT id, assigned_child_id, (now() at time zone 'America/Manaus')::date FROM upd WHERE ${once}::boolean
    ON CONFLICT (task_id, child_id, date) DO NOTHING
  `
  return { ok: true as const }
}

// Copia tarefas de uma criança para outra (rotina igual para irmãos). Pula as que a outra já tem
// e tira o horário se ele não couber no dia da criança que recebe.
export async function copyTasks(ownerId: string, fromChildId: string, toChildId: string, taskIds?: string[]) {
  if (!UUID.test(fromChildId) || !UUID.test(toChildId) || fromChildId === toChildId) {
    return { ok: false as const, status: 400 as const, error: 'Escolha duas crianças diferentes' }
  }
  const own = await sql`
    SELECT id FROM children WHERE owner_id = ${ownerId}::uuid AND id IN (${fromChildId}::uuid, ${toChildId}::uuid)
  `
  if (own.length !== 2) return { ok: false as const, status: 404 as const, error: 'Não encontrado' }

  const source = await sql`
    SELECT t.id, t.title, t.description, t.icon, t.points, t.recurrence, t.recurrence_days,
           to_char(t.due_time, 'HH24:MI') AS due_time
    FROM tasks t
    WHERE t.assigned_child_id = ${fromChildId}::uuid AND t.active
      AND (t.recurrence <> 'none' OR EXISTS (
        SELECT 1 FROM task_instances ti
        WHERE ti.task_id = t.id AND ti.date = (now() at time zone 'America/Manaus')::date))
    ORDER BY t.due_time NULLS LAST, t.created_at
  `
  const wanted = taskIds ? new Set(taskIds) : null
  let copied = 0
  let skipped = 0
  for (const t of source) {
    if (wanted && !wanted.has(t.id as string)) continue
    const base: TaskInput = {
      title: t.title as string,
      description: (t.description as string | null) ?? '',
      icon: (t.icon as string | null) ?? 'brilho',
      points: t.points as number,
      childId: toChildId,
      once: t.recurrence === 'none',
      days: (t.recurrence_days as string[] | null) ?? undefined,
      dueTime: t.due_time as string | null,
    }
    let r = await createTask(ownerId, base)
    if (!r.ok && base.dueTime && r.error.startsWith('O horário')) r = await createTask(ownerId, { ...base, dueTime: null })
    if (r.ok) copied++
    else skipped++
  }
  return { ok: true as const, copied, skipped }
}

// Lê o corpo JSON das rotas (criar e editar) já limpo e limitado.
export function taskInputFromBody(body: Record<string, unknown>): TaskInput {
  return {
    title: typeof body.title === 'string' ? body.title.trim().slice(0, 80) : '',
    description: typeof body.description === 'string' ? body.description.trim().slice(0, 500) : '',
    icon: typeof body.icon === 'string' ? body.icon.trim().slice(0, 24) : 'brilho',
    points: Number.isInteger(body.points) ? (body.points as number) : NaN,
    childId: typeof body.childId === 'string' ? body.childId : '',
    once: body.recurrence === 'none',
    days: body.recurrence === 'weekly' ? (normalizeDays(body.days) ?? undefined) : undefined,
    dueTime: typeof body.dueTime === 'string' && body.dueTime ? body.dueTime : null,
  }
}
