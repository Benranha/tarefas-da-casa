import { approveInstance, listAwaitingApproval, listTodayPending, markInstanceDone, rejectInstance } from '@/lib/instances'
import { deliverRedemption, listRequestedRedemptions } from '@/lib/recompensas'
import { UUID } from '@/lib/http'
import { checkTask, createTask, listChildren, listTasks, type TaskInput } from '@/lib/tarefas'

// Ferramentas que a IA de ajuda pode pedir ao servidor (function calling do Gemini).
// A IA só propõe: o ownerId vem sempre da sessão, e ações que gravam dados exigem
// confirmação do responsável na tela (a IA não consegue confirmar sozinha).
// Toda ferramenta é registrada em TOOLS e passa por runTool, o único ponto que decide
// se executa na hora (leitura) ou vira uma proposta (confirm: true).

export const AJUDA_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'listar_criancas',
        description: 'Lista as crianças da família (nome, pontos e horários de acordar e dormir).',
      },
      {
        name: 'listar_tarefas',
        description: 'Lista as tarefas ativas da família: título, criança, pontos e horário.',
      },
      {
        name: 'listar_fila',
        description: 'Lista as tarefas que as crianças marcaram como feitas e esperam aprovação (a Fila).',
      },
      {
        name: 'aprovar_tarefa',
        description:
          'Propõe aprovar tarefas que estão na Fila (soma os pontos). Serve para uma tarefa ou, com todas=true, para várias de uma vez (uma só confirmação). Só são aprovadas depois que o responsável confirmar na tela; não diga que já foram aprovadas.',
        parameters: {
          type: 'OBJECT',
          properties: {
            crianca: { type: 'STRING', description: 'Nome da criança, como em listar_fila. Deixe vazio para qualquer criança (só com todas=true).' },
            titulo: { type: 'STRING', description: 'Título da tarefa, como em listar_fila (pode ser parte do nome). Deixe vazio para qualquer um (só com todas=true).' },
            todas: { type: 'BOOLEAN', description: 'true quando o responsável pede várias de uma vez ("todas", "tudo", "todas da Ana"). Os filtros crianca e titulo continuam valendo.' },
          },
        },
      },
      {
        name: 'devolver_tarefa',
        description:
          'Propõe devolver uma tarefa da Fila para a criança tentar de novo, com um recado curto e gentil para ela. Só é devolvida depois que o responsável confirmar na tela; não diga que já foi devolvida.',
        parameters: {
          type: 'OBJECT',
          properties: {
            crianca: { type: 'STRING', description: 'Nome da criança, como em listar_fila.' },
            titulo: { type: 'STRING', description: 'Título da tarefa, como em listar_fila (pode ser parte do título).' },
            recado: { type: 'STRING', description: 'Recado curto para a criança (até 300 caracteres), dito pelo responsável, por exemplo o que falta fazer.' },
          },
          required: ['crianca', 'titulo', 'recado'],
        },
      },
      {
        name: 'listar_tarefas_de_hoje',
        description: 'Lista as tarefas de hoje que ainda estão pendentes (a criança ainda não marcou como feita).',
      },
      {
        name: 'marcar_tarefa_feita',
        description:
          'Propõe marcar como feitas, pela criança, tarefas pendentes de hoje. Elas vão para a Fila para aprovação (não soma pontos ainda). Serve para uma tarefa ou, com todas=true, para várias de uma vez. Só acontece depois que o responsável confirmar na tela.',
        parameters: {
          type: 'OBJECT',
          properties: {
            crianca: { type: 'STRING', description: 'Nome da criança, como em listar_tarefas_de_hoje. Deixe vazio para qualquer criança (só com todas=true).' },
            titulo: { type: 'STRING', description: 'Título da tarefa, como em listar_tarefas_de_hoje (pode ser parte do nome). Deixe vazio para qualquer um (só com todas=true).' },
            todas: { type: 'BOOLEAN', description: 'true quando o responsável pede várias de uma vez ("todas", "tudo", "todas da Ana"). Os filtros crianca e titulo continuam valendo.' },
          },
        },
      },
      {
        name: 'concluir_e_aprovar_tarefa',
        description:
          'Propõe marcar como feitas E aprovar de uma vez tarefas de hoje: vale para as pendentes e para as que já estão na Fila, e soma os pontos. Serve para uma tarefa ou, com todas=true, para várias (uma só confirmação). Só acontece depois que o responsável confirmar na tela.',
        parameters: {
          type: 'OBJECT',
          properties: {
            crianca: { type: 'STRING', description: 'Nome da criança. Deixe vazio para qualquer criança (só com todas=true).' },
            titulo: { type: 'STRING', description: 'Título da tarefa (pode ser parte do título). Deixe vazio para qualquer uma (só com todas=true).' },
            todas: { type: 'BOOLEAN', description: 'true quando o responsável pede várias de uma vez ("todas", "tudo", "todas da Ana"). Os filtros crianca e titulo continuam valendo.' },
          },
        },
      },
      {
        name: 'listar_pedidos_recompensa',
        description: 'Lista os prêmios que as crianças pediram e esperam ser entregues.',
      },
      {
        name: 'entregar_recompensa',
        description:
          'Propõe marcar como entregues prêmios que as crianças pediram. Serve para um prêmio ou, com todas=true, para vários de uma vez. Só acontece depois que o responsável confirmar na tela.',
        parameters: {
          type: 'OBJECT',
          properties: {
            crianca: { type: 'STRING', description: 'Nome da criança, como em listar_pedidos_recompensa. Deixe vazio para qualquer criança (só com todas=true).' },
            titulo: { type: 'STRING', description: 'Nome do prêmio, como em listar_pedidos_recompensa (pode ser parte do nome). Deixe vazio para qualquer um (só com todas=true).' },
            todas: { type: 'BOOLEAN', description: 'true quando o responsável pede várias de uma vez ("todas", "tudo", "todas da Ana"). Os filtros crianca e titulo continuam valendo.' },
          },
        },
      },
      {
        name: 'criar_tarefa',
        description:
          'Propõe a criação de uma tarefa para uma criança. A tarefa só é criada depois que o responsável confirmar na tela; não diga que já foi criada.',
        parameters: {
          type: 'OBJECT',
          properties: {
            crianca: { type: 'STRING', description: 'Nome da criança, como em listar_criancas.' },
            titulo: { type: 'STRING', description: 'Nome curto da tarefa, até 80 caracteres.' },
            pontos: { type: 'INTEGER', description: 'Pontos que a tarefa vale, de 0 a 1000.' },
            horario: { type: 'STRING', description: 'Horário opcional no formato HH:MM, entre acordar e dormir da criança.' },
            so_hoje: { type: 'BOOLEAN', description: 'true se for só para hoje; padrão false (repete todo dia).' },
          },
          required: ['crianca', 'titulo', 'pontos'],
        },
      },
    ],
  },
]

export type Proposal = {
  tool: string
  args: Record<string, unknown>
  resumo: string
}

export type ToolResult = { response: Record<string, unknown>; proposal?: Proposal }
export type CommitResult = { ok: true; message: string } | { ok: false; status: 400 | 404; error: string }

type ToolDef =
  | { confirm: false; run: (ownerId: string, args: Record<string, unknown>) => Promise<Record<string, unknown>> }
  | {
      confirm: true
      // Valida o pedido da IA e devolve o que o responsável vai confirmar (args é o que o botão envia de volta).
      prepare: (
        ownerId: string,
        args: Record<string, unknown>,
      ) => Promise<{ ok: true; args: Record<string, unknown>; resumo: string } | { ok: false; error: string }>
      // Executa de verdade, só depois do clique, revalidando os dados que voltaram do navegador.
      commit: (ownerId: string, userId: string, args: Record<string, unknown>) => Promise<CommitResult>
    }

const norm = (s: string) => s.trim().toLocaleLowerCase('pt-BR')

// Linhas do banco (id, child_name e title sempre presentes nas consultas usadas aqui).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Item = Record<string, any>

// Acha um item por criança + título (parte do título serve). Erros ensinam a IA a se corrigir.
// onde: onde a busca foi feita, ex.: "na Fila"; tipo: o que são os itens, ex.: "tarefa".
function pickOne<T extends Item>(items: T[], args: Record<string, unknown>, onde: string, tipo: string) {
  const kid = typeof args.crianca === 'string' ? norm(args.crianca) : ''
  const title = typeof args.titulo === 'string' ? norm(args.titulo) : ''
  if (!kid || !title) return { ok: false as const, error: `Informe a criança e ${tipo === 'tarefa' ? 'a tarefa' : 'o prêmio'}.` }

  const matches = items.filter((i) => norm(i.child_name as string) === kid && norm(i.title as string).includes(title))
  if (matches.length === 0) {
    const lista = items.map((i) => `${i.child_name}: ${i.title}`).join('; ')
    return { ok: false as const, error: `Nada ${onde} combina com isso. Agora ${onde}: ${lista || 'nada'}.` }
  }
  if (matches.length > 1) {
    return { ok: false as const, error: `Mais de um item combina: ${matches.map((i) => i.title).join('; ')}. Peça o título completo.` }
  }
  return { ok: true as const, item: matches[0] }
}

async function findInFila(ownerId: string, args: Record<string, unknown>) {
  return pickOne(await listAwaitingApproval(ownerId), args, 'na Fila', 'tarefa')
}

// Quantos itens uma ação em lote pode atingir de uma vez.
const MAX_BULK = 25

// Acha um ou vários itens por criança e/ou título (parte do título serve). Mais de um item só com todas=true.
// Erros ensinam a IA a se corrigir.
function pickMany<T extends Item>(items: T[], args: Record<string, unknown>, onde: string) {
  const kid = typeof args.crianca === 'string' ? norm(args.crianca) : ''
  const title = typeof args.titulo === 'string' ? norm(args.titulo) : ''
  const todas = args.todas === true || args.todas === 'true'
  if (!kid && !title && !todas) {
    return { ok: false as const, error: 'Diga a criança e a tarefa, ou use todas=true para todas.' }
  }
  const matches = items.filter((i) => (!kid || norm(i.child_name as string) === kid) && (!title || norm(i.title as string).includes(title)))
  if (matches.length === 0) {
    const lista = items.map((i) => `${i.child_name}: ${i.title}`).join('; ')
    return { ok: false as const, error: `Nada ${onde} combina com isso. Agora ${onde}: ${lista || 'nada'}.` }
  }
  if (matches.length > 1 && !todas) {
    return {
      ok: false as const,
      error: `Mais de um item combina: ${matches.map((i) => `${i.child_name}: ${i.title}`).join('; ')}. Se o responsável quer todos, chame de novo com todas=true; senão peça o título completo.`,
    }
  }
  if (matches.length > MAX_BULK) {
    return { ok: false as const, error: `São ${matches.length} itens; faço no máximo ${MAX_BULK} por vez. Peça por criança ou por título.` }
  }
  return { ok: true as const, items: matches }
}

// Resumo do cartão de confirmação: um item por extenso, vários em lista curta.
function resumoLote(verbo: string, items: Item[], extra = '') {
  if (items.length === 1) return `${verbo} "${items[0].title}" de ${items[0].child_name}${extra}.`
  const lista = items.slice(0, 6).map((i) => `${i.child_name}: ${i.title}`).join('; ')
  const resto = items.length > 6 ? ` e mais ${items.length - 6}` : ''
  return `${verbo} ${items.length} tarefas${extra}: ${lista}${resto}.`
}

// Ids que voltam do cartão (instanceIds, ou instanceId de cartões antigos), validados.
function idsDe(a: Record<string, unknown>, chave: string): string[] | null {
  const raw = Array.isArray(a[`${chave}s`]) ? (a[`${chave}s`] as unknown[]) : typeof a[chave] === 'string' ? [a[chave]] : []
  const ids = raw.filter((x): x is string => typeof x === 'string' && UUID.test(x))
  return ids.length > 0 && ids.length === raw.length && ids.length <= MAX_BULK ? ids : null
}

const pontos = (n: number) => `${n} ${n === 1 ? 'ponto' : 'pontos'}`
const tarefas = (n: number) => `${n} ${n === 1 ? 'tarefa' : 'tarefas'}`

// Aprova em sequência; devolve o que deu certo e quantas já não podiam mais ser aprovadas.
async function aprovarLote(ownerId: string, userId: string, ids: string[]) {
  const feitas: { childName: string; title: string; points: number }[] = []
  for (const id of ids) {
    const r = await approveInstance(ownerId, userId, id)
    if (r) feitas.push(r)
  }
  return { feitas, falhas: ids.length - feitas.length }
}

const TOOLS: Record<string, ToolDef> = {
  listar_criancas: {
    confirm: false,
    run: async (ownerId) => ({ criancas: await listChildren(ownerId) }),
  },
  listar_tarefas: {
    confirm: false,
    run: async (ownerId) => ({
      tarefas: (await listTasks(ownerId)).map((t) => ({
        titulo: t.title,
        crianca: t.child_name,
        pontos: t.points,
        horario: t.due_time,
        repete: t.recurrence !== 'none',
      })),
    }),
  },
  listar_fila: {
    confirm: false,
    run: async (ownerId) => ({
      fila: (await listAwaitingApproval(ownerId)).map((i) => ({ crianca: i.child_name, titulo: i.title, pontos: i.points })),
    }),
  },
  aprovar_tarefa: {
    confirm: true,
    prepare: async (ownerId, args) => {
      const found = pickMany(await listAwaitingApproval(ownerId), args, 'na Fila')
      if (!found.ok) return found
      const total = found.items.reduce((n, i) => n + Number(i.points ?? 0), 0)
      return {
        ok: true,
        args: { instanceIds: found.items.map((i) => i.id as string) },
        resumo: resumoLote('Aprovar', found.items, ` (+${pontos(total)})`),
      }
    },
    commit: async (ownerId, userId, a) => {
      const ids = idsDe(a, 'instanceId')
      if (!ids) return { ok: false, status: 400, error: 'Requisição inválida' }
      const { feitas, falhas } = await aprovarLote(ownerId, userId, ids)
      if (feitas.length === 0) return { ok: false, status: 400, error: 'Essas tarefas não podem ser aprovadas agora (talvez já tenham sido aprovadas).' }
      const total = feitas.reduce((n, f) => n + f.points, 0)
      const detalhe = feitas.length === 1 ? `"${feitas[0].title}" de ${feitas[0].childName}` : tarefas(feitas.length)
      const aviso = falhas ? ` (${tarefas(falhas)} já não estava mais na Fila)` : ''
      return { ok: true, message: `Aprovada${feitas.length === 1 ? '' : 's'}! ${detalhe} rendeu +${pontos(total)}.${aviso}` }
    },
  },
  devolver_tarefa: {
    confirm: true,
    prepare: async (ownerId, args) => {
      const found = await findInFila(ownerId, args)
      if (!found.ok) return found
      const note = typeof args.recado === 'string' ? args.recado.trim().slice(0, 300) : ''
      if (!note) return { ok: false, error: 'Informe o recado para a criança.' }
      const item = found.item
      return {
        ok: true,
        args: { instanceId: item.id as string, note },
        resumo: `Devolver "${item.title}" para ${item.child_name} com o recado: "${note}"`,
      }
    },
    commit: async (ownerId, _userId, a) => {
      const id = typeof a.instanceId === 'string' ? a.instanceId : ''
      if (!UUID.test(id)) return { ok: false, status: 400, error: 'Requisição inválida' }
      const note = typeof a.note === 'string' && a.note.trim() ? a.note.trim().slice(0, 300) : 'Tarefa precisa de melhorias'
      const done = await rejectInstance(ownerId, id, note)
      if (!done) return { ok: false, status: 400, error: 'Essa tarefa não está mais aguardando aprovação.' }
      return { ok: true, message: `Devolvi "${done.title}" para ${done.childName} com o seu recado.` }
    },
  },
  listar_tarefas_de_hoje: {
    confirm: false,
    run: async (ownerId) => ({
      pendentes: (await listTodayPending(ownerId)).map((i) => ({ crianca: i.child_name, titulo: i.title, pontos: i.points })),
    }),
  },
  marcar_tarefa_feita: {
    confirm: true,
    prepare: async (ownerId, args) => {
      const found = pickMany(await listTodayPending(ownerId), args, 'entre as pendentes de hoje')
      if (!found.ok) return found
      return {
        ok: true,
        args: { instanceIds: found.items.map((i) => i.id as string) },
        resumo: resumoLote('Marcar como feita', found.items, ' (vão para a Fila; os pontos só entram quando você aprovar)'),
      }
    },
    commit: async (ownerId, _userId, a) => {
      const ids = idsDe(a, 'instanceId')
      if (!ids) return { ok: false, status: 400, error: 'Requisição inválida' }
      const feitas: { childName: string; title: string }[] = []
      for (const id of ids) {
        const r = await markInstanceDone(ownerId, id)
        if (r) feitas.push(r)
      }
      if (feitas.length === 0) return { ok: false, status: 400, error: 'Essas tarefas não estão mais pendentes.' }
      const detalhe = feitas.length === 1 ? `"${feitas[0].title}" de ${feitas[0].childName}` : tarefas(feitas.length)
      return { ok: true, message: `Marquei ${detalhe} como feita${feitas.length === 1 ? '' : 's'}. Na Fila, esperando a sua aprovação.` }
    },
  },
  concluir_e_aprovar_tarefa: {
    confirm: true,
    prepare: async (ownerId, args) => {
      // Pendentes de hoje e já na Fila: aprovar serve para as duas (a pendente é marcada como feita e aprovada).
      const itens = [...(await listTodayPending(ownerId)), ...(await listAwaitingApproval(ownerId))]
      const found = pickMany(itens, args, 'entre as de hoje e a Fila')
      if (!found.ok) return found
      const total = found.items.reduce((n, i) => n + Number(i.points ?? 0), 0)
      return {
        ok: true,
        args: { instanceIds: found.items.map((i) => i.id as string) },
        resumo: resumoLote('Marcar como feita e aprovar', found.items, ` (+${pontos(total)})`),
      }
    },
    commit: async (ownerId, userId, a) => {
      const ids = idsDe(a, 'instanceId')
      if (!ids) return { ok: false, status: 400, error: 'Requisição inválida' }
      const { feitas, falhas } = await aprovarLote(ownerId, userId, ids)
      if (feitas.length === 0) return { ok: false, status: 400, error: 'Essas tarefas não podem ser aprovadas agora (talvez já tenham sido aprovadas).' }
      const total = feitas.reduce((n, f) => n + f.points, 0)
      const um = feitas.length === 1
      const detalhe = um ? `"${feitas[0].title}" de ${feitas[0].childName}` : tarefas(feitas.length)
      const aviso = falhas ? ` (${tarefas(falhas)} já não estava mais disponível)` : ''
      return { ok: true, message: `Pronto! ${detalhe} ${um ? 'marcada como feita e aprovada' : 'marcadas como feitas e aprovadas'}: +${pontos(total)}.${aviso}` }
    },
  },
  listar_pedidos_recompensa: {
    confirm: false,
    run: async (ownerId) => ({
      pedidos: (await listRequestedRedemptions(ownerId)).map((r) => ({ crianca: r.child_name, premio: r.title, pontos: r.cost_points })),
    }),
  },
  entregar_recompensa: {
    confirm: true,
    prepare: async (ownerId, args) => {
      const found = pickMany(await listRequestedRedemptions(ownerId), args, 'entre os pedidos')
      if (!found.ok) return found
      const lista = found.items.slice(0, 6).map((i) => `${i.title} (${i.child_name})`).join('; ')
      const resto = found.items.length > 6 ? ` e mais ${found.items.length - 6}` : ''
      const quantos = found.items.length
      return {
        ok: true,
        args: { redemptionIds: found.items.map((i) => i.id as string) },
        resumo: quantos === 1 ? `Marcar como entregue: ${lista}.` : `Marcar ${quantos} prêmios como entregues: ${lista}${resto}.`,
      }
    },
    commit: async (ownerId, _userId, a) => {
      const ids = idsDe(a, 'redemptionId')
      if (!ids) return { ok: false, status: 400, error: 'Requisição inválida' }
      const feitos: { childName: string; title: string }[] = []
      for (const id of ids) {
        const r = await deliverRedemption(ownerId, id)
        if (r) feitos.push(r)
      }
      if (feitos.length === 0) return { ok: false, status: 400, error: 'Esses pedidos não estão mais aguardando.' }
      const um = feitos.length === 1
      const detalhe = um ? `"${feitos[0].title}" para ${feitos[0].childName}` : `${feitos.length} prêmios`
      return { ok: true, message: `Pronto! ${detalhe} marcado${um ? '' : 's'} como entregue${um ? '' : 's'}.` }
    },
  },
  criar_tarefa: {
    confirm: true,
    prepare: async (ownerId, args) => {
      const name = typeof args.crianca === 'string' ? args.crianca : ''
      const title = typeof args.titulo === 'string' ? args.titulo.trim().slice(0, 80) : ''
      const points = typeof args.pontos === 'number' ? Math.trunc(args.pontos) : NaN
      const dueTime = typeof args.horario === 'string' && args.horario.trim() ? args.horario.trim() : null

      const kids = await listChildren(ownerId)
      const matches = kids.filter((k) => norm(k.name as string) === norm(name))
      if (matches.length === 0) {
        return { ok: false, error: `Criança "${name}" não encontrada. Crianças: ${kids.map((k) => k.name).join(', ') || 'nenhuma'}.` }
      }
      if (matches.length > 1) return { ok: false, error: `Há mais de uma criança chamada "${name}".` }

      const input: TaskInput = { title, points, childId: matches[0].id as string, once: args.so_hoje === true, dueTime }
      const check = await checkTask(ownerId, input)
      if (!check.ok) return { ok: false, error: check.error }

      const quando = input.once ? 'só hoje' : 'todo dia'
      const hora = dueTime ? ` às ${dueTime}` : ''
      return {
        ok: true,
        args: { childId: input.childId, title, points, dueTime, once: input.once === true },
        resumo: `Criar "${title}" para ${check.childName}: ${points} pontos, ${quando}${hora}.`,
      }
    },
    commit: async (ownerId, _userId, a) => {
      const result = await createTask(ownerId, {
        title: typeof a.title === 'string' ? a.title.trim().slice(0, 80) : '',
        points: Number.isInteger(a.points) ? (a.points as number) : NaN,
        childId: typeof a.childId === 'string' ? a.childId : '',
        once: a.once === true,
        dueTime: typeof a.dueTime === 'string' && a.dueTime ? a.dueTime : null,
      })
      if (!result.ok) return result
      return { ok: true, message: `Pronto! Criei a tarefa "${String(a.title)}" para ${result.childName}.` }
    },
  },
}

// Único ponto de entrada das chamadas da IA: leitura roda direto; escrita vira proposta.
// Erros voltam como { erro } para a IA se corrigir no passo seguinte.
export async function runTool(ownerId: string, name: string, args: Record<string, unknown>): Promise<ToolResult> {
  const tool = Object.hasOwn(TOOLS, name) ? TOOLS[name] : undefined
  if (!tool) return { response: { erro: 'Ferramenta desconhecida.' } }
  if (!tool.confirm) return { response: await tool.run(ownerId, args) }

  const prepared = await tool.prepare(ownerId, args)
  if (!prepared.ok) return { response: { erro: prepared.error } }
  return {
    response: { status: 'aguardando confirmação do responsável na tela' },
    proposal: { tool: name, args: prepared.args, resumo: prepared.resumo },
  }
}

// Executa uma proposta depois do clique em Confirmar. Só ferramentas com confirm: true chegam aqui.
export async function commitTool(ownerId: string, userId: string, name: string, args: Record<string, unknown>): Promise<CommitResult | null> {
  const tool = Object.hasOwn(TOOLS, name) ? TOOLS[name] : undefined
  if (!tool?.confirm) return null
  return tool.commit(ownerId, userId, args)
}
