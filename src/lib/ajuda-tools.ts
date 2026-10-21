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
      commit: (ownerId: string, args: Record<string, unknown>) => Promise<CommitResult>
    }

const norm = (s: string) => s.trim().toLocaleLowerCase('pt-BR')

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
    commit: async (ownerId, a) => {
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
export async function commitTool(ownerId: string, name: string, args: Record<string, unknown>): Promise<CommitResult | null> {
  const tool = Object.hasOwn(TOOLS, name) ? TOOLS[name] : undefined
  if (!tool?.confirm) return null
  return tool.commit(ownerId, args)
}
