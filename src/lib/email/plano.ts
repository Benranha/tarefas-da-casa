// Quem recebe qual e-mail. Só decisão: nada aqui fala com o banco nem envia nada, então dá para
// ler e testar sozinho. Quem carrega os dados e envia é rotina.ts.
//
// Limites, de propósito apertados (docs/vendas/README.md: a família só recebe o que pediu e um "não"
// basta): no máximo 1 e-mail por semana, no máximo 4 dicas no total, 1 "sem uso" por mês, e nada
// para quem pediu para parar.

export type FamiliaEmail = {
  ownerId: string
  email: string
  nome: string // do responsável titular; pode ser vazio
  status: string // trialing, active, ...
  criadaHaDias: number
  awayDias: number | null // dias desde o último uso, no fuso da casa; null = sem registro de uso
  temTarefa: boolean // terminou o onboarding
  aguardando: number // tarefas feitas pelas crianças esperando aprovação
  usaPremios: boolean
  outrosResponsaveis: number
  criancaComAparelho: boolean
  responsavelComPush: boolean
  enviados: string[] // chaves de email_log
  ultimoEnvio: Date | null
  aceitaDicas: boolean
}

// O que o servidor tem configurado. Uma dica sobre o assistente ou sobre avisos no celular só vale
// se o recurso funciona de verdade.
export type Ambiente = { agora: Date; assistente: boolean; push: boolean }

export type Novidade = {
  id: string
  assunto: string // sem ponto de interrogação nem exclamação
  texto: string // uma ideia, frases curtas
  botao: string
  caminho: string // tela do painel para onde o botão leva
  disponivel: (a: Ambiente) => boolean
  jaUsa: (f: FamiliaEmail) => boolean
}

// Só recursos que existem no app de hoje (confira em src/lib/ajuda.ts antes de acrescentar). A ordem é a
// da prioridade: a primeira que a família ainda não usa e ainda não recebeu.
export const NOVIDADES: Novidade[] = [
  {
    id: 'premios',
    assunto: 'Os pontos podem virar prêmios',
    texto: 'Os pontos das tarefas podem virar prêmios. Cadastre o primeiro em Recompensas, e a criança pede quando juntar pontos.',
    botao: 'Cadastrar um prêmio',
    caminho: '/pais/recompensas',
    disponivel: () => true,
    jaUsa: (f) => f.usaPremios,
  },
  {
    id: 'assistente',
    assunto: 'Dá para criar tarefas escrevendo uma frase',
    texto: 'Você pode pedir ao assistente do painel para criar uma tarefa. Escreva algo como “arrumar a cama, 10 pontos” e toque em Confirmar.',
    botao: 'Abrir a Fila',
    caminho: '/pais',
    disponivel: (a) => a.assistente,
    jaUsa: () => false, // não há como saber se já usou
  },
  {
    id: 'link-crianca',
    assunto: 'Seu filho pode ter o link dele',
    texto: 'Seu filho pode ter o link dele e receber lembretes no celular. Marque “Tem celular ou computador” em Crianças.',
    botao: 'Abrir Crianças',
    caminho: '/pais/criancas',
    disponivel: () => true,
    jaUsa: (f) => f.criancaComAparelho,
  },
  {
    id: 'notificacao',
    assunto: 'Receba um aviso quando a tarefa terminar',
    texto: 'O Tarefinha pode avisar no seu celular quando seu filho terminar uma tarefa. Ative as notificações em Família.',
    botao: 'Abrir Família',
    caminho: '/pais/familia',
    disponivel: (a) => a.push,
    jaUsa: (f) => f.responsavelComPush,
  },
  {
    id: 'convite',
    assunto: 'Outro responsável pode usar a mesma família',
    texto: 'Outro pai ou mãe pode usar a mesma família e aprovar tarefas também. Gere o convite em Família.',
    botao: 'Abrir Família',
    caminho: '/pais/familia',
    disponivel: () => true,
    jaUsa: (f) => f.outrosResponsaveis > 0,
  },
]

export const LIMITES = {
  boasVindasAteDias: 3, // só para quem acabou de entrar: ninguém recebe "boas-vindas" meses depois
  semUsoDeDias: 3,
  semUsoAteDias: 6,
  entreEmailsDias: 7, // novidade espera 7 dias desde qualquer e-mail
  entreSemUsoEOutroDias: 3,
  novidadeSoSeUsouNosUltimosDias: 7,
  maxDicas: 4,
}

export type Plano =
  | { tipo: 'boas_vindas'; chaves: string[] }
  | { tipo: 'sem_uso'; chaves: string[]; variante: 'aprovacao' | 'dica'; novidade?: Novidade }
  | { tipo: 'novidade'; chaves: string[]; novidade: Novidade }

const DIA = 86_400_000

// A primeira novidade que o servidor suporta, a família ainda não usa e ainda não recebeu.
export function proximaNovidade(f: FamiliaEmail, amb: Ambiente): Novidade | null {
  const jaRecebeu = (id: string) =>
    f.enviados.includes(`dica:${id}`) ||
    (id === 'assistente' && f.enviados.includes('boas_vindas')) // o e-mail de boas-vindas já apresenta o assistente
  return NOVIDADES.find((n) => n.disponivel(amb) && !n.jaUsa(f) && !jaRecebeu(n.id)) ?? null
}

export function decidir(f: FamiliaEmail, amb: Ambiente): Plano | null {
  if (!['trialing', 'active'].includes(f.status) || !f.temTarefa) return null
  if (!f.aceitaDicas) return null // um "não" vale para tudo, inclusive as boas-vindas

  if (!f.enviados.includes('boas_vindas') && f.criadaHaDias <= LIMITES.boasVindasAteDias) {
    return { tipo: 'boas_vindas', chaves: ['boas_vindas'] }
  }

  const desdeUltimo = f.ultimoEnvio ? (amb.agora.getTime() - f.ultimoEnvio.getTime()) / DIA : Infinity
  const mes = amb.agora.toISOString().slice(0, 7)
  const chaveSemUso = `sem_uso:${mes}`
  const dicasEnviadas = f.enviados.filter((k) => k.startsWith('dica:')).length

  const semUso = f.awayDias !== null && f.awayDias >= LIMITES.semUsoDeDias && f.awayDias <= LIMITES.semUsoAteDias
  if (semUso && !f.enviados.includes(chaveSemUso) && desdeUltimo >= LIMITES.entreSemUsoEOutroDias) {
    if (f.aguardando > 0) return { tipo: 'sem_uso', variante: 'aprovacao', chaves: [chaveSemUso] }
    const n = dicasEnviadas < LIMITES.maxDicas ? proximaNovidade(f, amb) : null
    return { tipo: 'sem_uso', variante: 'dica', novidade: n ?? undefined, chaves: n ? [chaveSemUso, `dica:${n.id}`] : [chaveSemUso] }
  }

  if (desdeUltimo < LIMITES.entreEmailsDias) return null
  if (f.awayDias === null || f.awayDias > LIMITES.novidadeSoSeUsouNosUltimosDias) return null
  if (dicasEnviadas >= LIMITES.maxDicas) return null
  const n = proximaNovidade(f, amb)
  return n ? { tipo: 'novidade', novidade: n, chaves: [`dica:${n.id}`] } : null
}
