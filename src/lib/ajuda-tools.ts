import { checkTask, listChildren, listTasks, type TaskInput } from '@/lib/tarefas'

// Ferramentas que a IA de ajuda pode pedir ao servidor (function calling do Gemini).
// A IA só propõe: o ownerId vem sempre da sessão, e ações que gravam dados exigem
// confirmação do responsável na tela (a IA não consegue confirmar sozinha).

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
  tool: 'criar_tarefa'
  args: { childId: string; title: string; points: number; dueTime: string | null; once: boolean }
  resumo: string
}

export type ToolResult = { response: Record<string, unknown>; proposal?: Proposal }

const norm = (s: string) => s.trim().toLocaleLowerCase('pt-BR')

// Converte e valida os argumentos de criar_tarefa vindos da IA ou do botão Confirmar.
export async function resolveCriarTarefa(
  ownerId: string,
  args: Record<string, unknown>,
): Promise<{ ok: true; input: TaskInput; childName: string } | { ok: false; error: string }> {
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
  return { ok: true, input, childName: check.childName }
}

export async function runTool(ownerId: string, name: string, args: Record<string, unknown>): Promise<ToolResult> {
  if (name === 'listar_criancas') {
    return { response: { criancas: await listChildren(ownerId) } }
  }
  if (name === 'listar_tarefas') {
    const rows = await listTasks(ownerId)
    return {
      response: {
        tarefas: rows.map((t) => ({
          titulo: t.title,
          crianca: t.child_name,
          pontos: t.points,
          horario: t.due_time,
          repete: t.recurrence !== 'none',
        })),
      },
    }
  }
  if (name === 'criar_tarefa') {
    const r = await resolveCriarTarefa(ownerId, args)
    if (!r.ok) return { response: { erro: r.error } }
    const { input } = r
    const quando = input.once ? 'só hoje' : 'todo dia'
    const hora = input.dueTime ? ` às ${input.dueTime}` : ''
    return {
      response: { status: 'aguardando confirmação do responsável na tela' },
      proposal: {
        tool: 'criar_tarefa',
        args: { childId: input.childId, title: input.title, points: input.points, dueTime: input.dueTime ?? null, once: input.once === true },
        resumo: `Criar "${input.title}" para ${r.childName}: ${input.points} pontos, ${quando}${hora}.`,
      },
    }
  }
  return { response: { erro: 'Ferramenta desconhecida.' } }
}
