import { sql } from '@/lib/db'
import { TIME, UUID } from '@/lib/http'
import { problemaNoTextoParaCrianca } from '@/lib/ajuda-gate'
import { TF_GROUPS } from '@/lib/tf-icons-data'
import { checkTask, copyTasks, createTask, listChildren, normalizeDays, updateTask, type TaskInput } from '@/lib/tarefas'

// Ações do conector do Claude que mudam dados: o Claude age direto, a pedido do responsável que autorizou a conexão
// (decisão do dono do produto; o assistente do painel continua só propondo, em ajuda-tools.ts). Mesmo assim,
// cada ação usa as regras do painel (tarefas.ts) e o que a criança lê passa pelo filtro de texto em código.
// Fica de fora de propósito: crianças, família, convites, códigos e link do totem.

export const ICONES_TAREFA = [...TF_GROUPS.tarefas, 'brilho'] as [string, ...string[]]
export const ICONES_PREMIO = [...TF_GROUPS.recompensas] as [string, ...string[]]

export const DIAS = { seg: 'mon', ter: 'tue', qua: 'wed', qui: 'thu', sex: 'fri', sab: 'sat', dom: 'sun' } as const
export type DiaPt = keyof typeof DIAS
const DIA_PT: Record<string, string> = Object.fromEntries(Object.entries(DIAS).map(([pt, en]) => [en, pt]))

export type Repeticao = 'todo_dia' | 'so_hoje' | 'dias_da_semana'

export type CamposTarefa = {
  titulo?: string
  descricao?: string
  icone?: string
  pontos?: number
  crianca?: string
  repeticao?: Repeticao
  dias?: string[]
  horario?: string | null
}

export type Resultado<T extends object = object> = ({ ok: true; mensagem: string } & T) | { ok: false; erro: string }

const norm = (s: string) => s.trim().toLocaleLowerCase('pt-BR')
const pontos = (n: number) => `${n} ${n === 1 ? 'ponto' : 'pontos'}`
const falha = (erro: string): { ok: false; erro: string } => ({ ok: false, erro })

// Texto que a criança vai ler: o mesmo filtro em código do assistente do painel.
function textoDaCrianca(...textos: (string | undefined)[]): string | null {
  for (const t of textos) {
    if (!t) continue
    const problema = problemaNoTextoParaCrianca(t)
    if (problema) return problema
  }
  return null
}

async function achaCrianca(ownerId: string, nome: string): Promise<{ ok: true; id: string; nome: string } | { ok: false; erro: string }> {
  const kids = await listChildren(ownerId)
  const m = kids.filter((k) => norm(String(k.name)) === norm(nome))
  if (m.length === 1) return { ok: true, id: String(m[0].id), nome: String(m[0].name) }
  if (m.length > 1) return falha(`Há mais de uma criança chamada "${nome}".`)
  return falha(`Criança "${nome}" não encontrada. Crianças: ${kids.map((k) => k.name).join(', ') || 'nenhuma'}.`)
}

function diasValidos(dias: string[] | undefined): { ok: true; dias: string[] } | { ok: false; erro: string } {
  const lista = Array.isArray(dias) ? dias : []
  const invalidos = lista.filter((d) => !(d in DIAS))
  if (invalidos.length) return falha(`Dia inválido: ${invalidos.join(', ')}. Use seg, ter, qua, qui, sex, sab ou dom.`)
  const en = normalizeDays(lista.map((d) => DIAS[d as DiaPt]))
  if (!en) return falha('Para "dias_da_semana", informe de 1 a 6 dias diferentes. Para todos os dias, use "todo_dia".')
  return { ok: true, dias: en }
}

export function descreverRepeticao(recurrence: string | null, days: string[] | null): { repeticao: Repeticao; dias: string[] } {
  if (recurrence === 'none') return { repeticao: 'so_hoje', dias: [] }
  if (recurrence === 'weekly' && days?.length) return { repeticao: 'dias_da_semana', dias: days.map((d) => DIA_PT[d] ?? d) }
  return { repeticao: 'todo_dia', dias: [] }
}

function resumoTarefa(t: { title: string; childName: string; points: number; repeticao: Repeticao; dias: string[]; dueTime: string | null }) {
  const quando = t.repeticao === 'so_hoje' ? 'só hoje' : t.repeticao === 'dias_da_semana' ? `nos dias ${t.dias.join(', ')}` : 'todo dia'
  return `"${t.title}" para ${t.childName}: ${pontos(t.points)}, ${quando}${t.dueTime ? `, às ${t.dueTime}` : ''}`
}

// Monta o TaskInput a partir dos campos que o Claude mandou (e, na edição, do que a tarefa já tem).
type Atual = { title: string; description: string; icon: string; points: number; childId: string; recurrence: string; days: string[] | null; dueTime: string | null }

async function montar(ownerId: string, c: CamposTarefa, atual: Atual | null): Promise<{ ok: true; input: TaskInput; childName: string } | { ok: false; erro: string }> {
  const titulo = (c.titulo ?? atual?.title ?? '').trim().slice(0, 80)
  const descricao = (c.descricao ?? atual?.description ?? '').trim().slice(0, 500)
  const icone = c.icone ?? atual?.icon ?? 'brilho'
  const pts = c.pontos ?? atual?.points
  if (!titulo) return falha('Informe o título da tarefa.')
  if (typeof pts !== 'number' || !Number.isInteger(pts) || pts < 0 || pts > 1000) return falha('Os pontos precisam ser um número inteiro de 0 a 1000.')
  if (!ICONES_TAREFA.includes(icone)) return falha(`Ícone "${icone}" não existe. Use um destes: ${ICONES_TAREFA.join(', ')}.`)
  const proibido = textoDaCrianca(c.titulo, c.descricao)
  if (proibido) return falha(proibido)

  let childId = atual?.childId ?? ''
  let childName = ''
  if (c.crianca !== undefined || !atual) {
    const k = await achaCrianca(ownerId, c.crianca ?? '')
    if (!k.ok) return k
    childId = k.id
    childName = k.nome
  }

  // Repetição: o que veio manda; se nada veio, a tarefa continua como estava.
  let repeticao: Repeticao
  let days: string[] | undefined
  if (c.repeticao || c.dias) {
    repeticao = c.repeticao ?? 'dias_da_semana'
    if (repeticao === 'dias_da_semana') {
      const d = diasValidos(c.dias)
      if (!d.ok) return d
      days = d.dias
    } else if (c.dias && c.dias.length) {
      return falha('"dias" só vale com repeticao "dias_da_semana".')
    }
  } else if (atual) {
    const r = descreverRepeticao(atual.recurrence, atual.days)
    repeticao = r.repeticao
    days = atual.recurrence === 'weekly' ? (atual.days ?? undefined) : undefined
  } else {
    repeticao = 'todo_dia'
  }

  const dueTime = c.horario === undefined ? (atual?.dueTime ?? null) : c.horario ? c.horario : null
  if (dueTime && !TIME.test(dueTime)) return falha('Horário inválido. Use HH:MM, por exemplo 07:30.')

  return { ok: true, childName, input: { title: titulo, description: descricao, icon: icone, points: pts, childId, once: repeticao === 'so_hoje', days, dueTime } }
}

// ---------- tarefas ----------

export async function criarTarefa(ownerId: string, c: CamposTarefa): Promise<Resultado<{ id: string }>> {
  const m = await montar(ownerId, c, null)
  if (!m.ok) return m
  const r = await createTask(ownerId, m.input)
  if (!r.ok) return falha(r.error)
  const rep = m.input.once ? 'so_hoje' : m.input.days?.length ? 'dias_da_semana' : 'todo_dia'
  const dias = (m.input.days ?? []).map((d) => DIA_PT[d])
  return { ok: true, id: r.id, mensagem: `Criei ${resumoTarefa({ title: m.input.title, childName: r.childName, points: m.input.points, repeticao: rep, dias, dueTime: m.input.dueTime ?? null })}.` }
}

export const MAX_VARIAS = 20

// Valida todas antes de criar a primeira (ou cria todas, ou nenhuma por erro de dados).
export async function criarVariasTarefas(ownerId: string, lista: CamposTarefa[]): Promise<Resultado<{ criadas: number }>> {
  if (lista.length === 0) return falha('Informe as tarefas.')
  if (lista.length > MAX_VARIAS) return falha(`Até ${MAX_VARIAS} tarefas por vez.`)
  const montadas: { input: TaskInput; childName: string }[] = []
  const vistos = new Set<string>()
  for (const [i, c] of lista.entries()) {
    const m = await montar(ownerId, c, null)
    if (!m.ok) return falha(`Tarefa ${i + 1} (${String(c.titulo ?? '').slice(0, 40)}): ${m.erro}`)
    const check = await checkTask(ownerId, m.input)
    if (!check.ok) return falha(`Tarefa ${i + 1} (${m.input.title}): ${check.error}`)
    if (!m.input.once) {
      const chave = `${m.input.childId}|${norm(m.input.title)}`
      if (vistos.has(chave)) return falha(`A tarefa "${m.input.title}" aparece duas vezes para a mesma criança.`)
      vistos.add(chave)
    }
    montadas.push(m)
  }
  let criadas = 0
  const falhas: string[] = []
  for (const m of montadas) {
    const r = await createTask(ownerId, m.input)
    if (r.ok) criadas++
    else falhas.push(r.error)
  }
  if (criadas === 0) return falha(falhas[0] ?? 'Não foi possível criar as tarefas.')
  const aviso = falhas.length ? ` ${falhas.length} não puderam ser criadas: ${falhas[0]}` : ''
  return { ok: true, criadas, mensagem: `Criei ${criadas} ${criadas === 1 ? 'tarefa' : 'tarefas'}.${aviso}` }
}

async function tarefaAtual(ownerId: string, id: string): Promise<Atual | null> {
  const rows = await sql`
    SELECT t.title, t.description, t.icon, t.points, t.assigned_child_id, t.recurrence, t.recurrence_days,
           to_char(t.due_time, 'HH24:MI') AS due_time
    FROM tasks t JOIN children c ON c.id = t.assigned_child_id
    WHERE t.id = ${id}::uuid AND c.owner_id = ${ownerId}::uuid
  `
  if (rows.length === 0) return null
  const r = rows[0]
  return {
    title: String(r.title),
    description: String(r.description ?? ''),
    icon: String(r.icon ?? 'brilho'),
    points: Number(r.points),
    childId: String(r.assigned_child_id),
    recurrence: String(r.recurrence ?? 'daily'),
    days: (r.recurrence_days as string[] | null) ?? null,
    dueTime: (r.due_time as string | null) ?? null,
  }
}

// Só muda o que veio; o resto da tarefa fica como está.
export async function atualizarTarefa(ownerId: string, id: string, c: CamposTarefa): Promise<Resultado> {
  if (!UUID.test(id)) return falha('Id de tarefa inválido. Use listar_tarefas para ver os ids.')
  if (Object.values(c).every((v) => v === undefined)) return falha('Diga o que mudar (título, pontos, horário, dias, criança, ícone ou descrição).')
  const atual = await tarefaAtual(ownerId, id)
  if (!atual) return falha('Tarefa não encontrada. Use listar_tarefas para ver os ids.')
  const m = await montar(ownerId, c, atual)
  if (!m.ok) return m
  const r = await updateTask(ownerId, id, m.input)
  if (!r.ok) return falha(r.error)
  return { ok: true, mensagem: `Atualizei a tarefa "${m.input.title}".` }
}

export async function apagarTarefa(ownerId: string, id: string): Promise<Resultado> {
  if (!UUID.test(id)) return falha('Id de tarefa inválido. Use listar_tarefas para ver os ids.')
  const rows = await sql`
    DELETE FROM tasks t USING children c
    WHERE t.id = ${id}::uuid AND c.id = t.assigned_child_id AND c.owner_id = ${ownerId}::uuid
    RETURNING t.title, c.name
  `
  if (rows.length === 0) return falha('Tarefa não encontrada. Use listar_tarefas para ver os ids.')
  return { ok: true, mensagem: `Apaguei a tarefa "${String(rows[0].title)}" de ${String(rows[0].name)}, com o histórico dela.` }
}

export async function copiarTarefas(ownerId: string, de: string, para: string, ids?: string[]): Promise<Resultado<{ copiadas: number; puladas: number }>> {
  const a = await achaCrianca(ownerId, de)
  if (!a.ok) return a
  const b = await achaCrianca(ownerId, para)
  if (!b.ok) return b
  if (ids && ids.some((i) => !UUID.test(i))) return falha('Id de tarefa inválido. Use listar_tarefas para ver os ids.')
  const r = await copyTasks(ownerId, a.id, b.id, ids)
  if (!r.ok) return falha(r.error)
  return {
    ok: true,
    copiadas: r.copied,
    puladas: r.skipped,
    mensagem: `Copiei ${r.copied} ${r.copied === 1 ? 'tarefa' : 'tarefas'} de ${a.nome} para ${b.nome}.${r.skipped ? ` ${r.skipped} já existiam ou não couberam e foram puladas.` : ''}`,
  }
}

// ---------- prêmios ----------

export type CamposPremio = { titulo?: string; custo_pontos?: number; icone?: string }

function validarPremio(c: CamposPremio, atual: { title: string; cost: number; icon: string } | null) {
  const titulo = (c.titulo ?? atual?.title ?? '').trim().slice(0, 80)
  const custo = c.custo_pontos ?? atual?.cost
  const icone = c.icone ?? atual?.icon ?? 'presente'
  if (!titulo) return falha('Informe o nome do prêmio.')
  if (typeof custo !== 'number' || !Number.isInteger(custo) || custo < 1 || custo > 100000) return falha('O custo precisa ser um número inteiro de 1 a 100000 pontos.')
  if (!ICONES_PREMIO.includes(icone)) return falha(`Ícone "${icone}" não existe para prêmio. Use um destes: ${ICONES_PREMIO.join(', ')}.`)
  const proibido = textoDaCrianca(c.titulo)
  if (proibido) return falha(proibido)
  return { ok: true as const, titulo, custo, icone }
}

export async function criarPremio(ownerId: string, c: CamposPremio): Promise<Resultado<{ id: string }>> {
  const v = validarPremio(c, null)
  if (!v.ok) return v
  const rows = await sql`
    INSERT INTO rewards (owner_id, title, icon, cost_points) VALUES (${ownerId}::uuid, ${v.titulo}, ${v.icone}, ${v.custo}) RETURNING id
  `
  return { ok: true, id: String(rows[0].id), mensagem: `Cadastrei o prêmio "${v.titulo}" por ${pontos(v.custo)}.` }
}

export async function atualizarPremio(ownerId: string, id: string, c: CamposPremio): Promise<Resultado> {
  if (!UUID.test(id)) return falha('Id de prêmio inválido. Use listar_premios para ver os ids.')
  if (Object.values(c).every((x) => x === undefined)) return falha('Diga o que mudar (nome, custo ou ícone).')
  const cur = await sql`SELECT title, cost_points, icon FROM rewards WHERE id = ${id}::uuid AND owner_id = ${ownerId}::uuid`
  if (cur.length === 0) return falha('Prêmio não encontrado. Use listar_premios para ver os ids.')
  const v = validarPremio(c, { title: String(cur[0].title), cost: Number(cur[0].cost_points), icon: String(cur[0].icon ?? 'presente') })
  if (!v.ok) return v
  await sql`UPDATE rewards SET title = ${v.titulo}, icon = ${v.icone}, cost_points = ${v.custo} WHERE id = ${id}::uuid AND owner_id = ${ownerId}::uuid`
  return { ok: true, mensagem: `Atualizei o prêmio "${v.titulo}": ${pontos(v.custo)}.` }
}

export async function apagarPremio(ownerId: string, id: string): Promise<Resultado> {
  if (!UUID.test(id)) return falha('Id de prêmio inválido. Use listar_premios para ver os ids.')
  const rows = await sql`DELETE FROM rewards WHERE id = ${id}::uuid AND owner_id = ${ownerId}::uuid RETURNING title`
  if (rows.length === 0) return falha('Prêmio não encontrado. Use listar_premios para ver os ids.')
  return { ok: true, mensagem: `Apaguei o prêmio "${String(rows[0].title)}". Pedidos que já estavam feitos continuam na lista.` }
}

// Recusa o pedido e devolve os pontos reservados, numa única instrução (igual ao painel).
export async function recusarPedido(ownerId: string, id: string): Promise<Resultado> {
  if (!UUID.test(id)) return falha('Id de pedido inválido. Use listar_pedidos_recompensa para ver os ids.')
  const rows = await sql`
    WITH denied AS (
      UPDATE reward_redemptions rr
      SET status = 'denied', resolved_at = now()
      FROM children c
      WHERE rr.id = ${id}::uuid AND c.id = rr.child_id AND c.owner_id = ${ownerId}::uuid AND rr.status = 'requested'
      RETURNING rr.child_id, rr.cost_points, rr.title
    ), pts AS (
      UPDATE children c SET points = c.points + d.cost_points FROM denied d WHERE c.id = d.child_id RETURNING c.name, d.title, d.cost_points
    )
    SELECT name, title, cost_points FROM pts
  `
  if (rows.length === 0) return falha('Esse pedido não está mais aguardando (talvez já tenha sido entregue ou recusado).')
  return { ok: true, mensagem: `Recusei o pedido "${String(rows[0].title)}" de ${String(rows[0].name)} e devolvi ${pontos(Number(rows[0].cost_points))}.` }
}
