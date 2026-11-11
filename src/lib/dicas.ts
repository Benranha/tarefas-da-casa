import { useCallback, useEffect, useSyncExternalStore, type RefObject } from 'react'

// Dicas dentro do app: balões "toque aqui" (apontam para um botão) e cartões "Você sabia?".
//
// Regras para não incomodar, todas aplicadas aqui:
// - Só aparece uma dica por vez, e só uma por abertura do app (depois que a pessoa dispensa uma,
//   as outras esperam a próxima abertura).
// - Balões vêm antes dos cartões. Entre dois do mesmo tipo vale a prioridade (número menor primeiro).
// - Cartões esperam 24 horas depois do último dispensado.
// - Nada aparece antes do tutorial ter sido visto, nem com as dicas desligadas.
// - O que já foi dispensado não volta, neste aparelho. Ligar as dicas de novo limpa essa lista.
//
// O texto de tudo que a pessoa lê está neste arquivo, para revisar com docs/vendas/escrita.md.

export type TipoDica = 'toque' | 'sabia'

// Balões "toque aqui". Frase curta, aponta para um controle que existe.
export const TOQUE_AQUI = {
  'pais.adicionar': 'Toque no + para criar uma tarefa.',
  'pais.ajuda': 'Ficou em dúvida? Toque aqui e pergunte.',
  'pais.mais': 'Prêmios e histórico ficam em Mais.',
  'fila.devolver': 'Toque em Devolver para escrever um recado. A criança lê.',
  'tarefas.menu': 'Toque nos três pontinhos para editar, copiar ou remover.',
  'crianca.tarefa': 'Toque na tarefa para marcar como feita ou aprovar.',
  'filho.terminei': 'Terminou? Toque aqui.',
  'filho.premios': 'Seus pontos viram prêmios. Toque aqui.',
  'totem.terminei': 'Terminou? Toque aqui.',
} as const
export type ToqueAquiId = keyof typeof TOQUE_AQUI

// Cartões "Você sabia?". O título "Você sabia?" já está no cartão, o texto completa a ideia.
export const VOCE_SABIA = {
  'fila.assistente': {
    texto: 'Dá para criar uma tarefa escrevendo uma frase. O assistente monta e você confirma.',
    pedido: 'Crie a tarefa “arrumar a cama” com 10 pontos',
  },
  'fila.aprovar-tudo': {
    texto: 'Dá para aprovar todas as tarefas de uma criança de uma vez. Peça ao assistente.',
    pedido: 'Aprove todas as tarefas que estão aguardando',
  },
  'tarefas.dias': {
    texto: 'A tarefa pode repetir só em alguns dias da semana. Escolha os dias ao criar.',
  },
  'tarefas.copiar': {
    texto: 'Dá para copiar as tarefas de uma criança para outra, sem criar tudo de novo.',
  },
  'criancas.link': {
    texto: 'Seu filho pode ter o link dele e receber lembretes no celular. Marque “Tem celular ou computador”.',
  },
  'familia.convite': {
    texto: 'Outro responsável pode usar a mesma família. Gere o convite em Família.',
  },
} as const
export type VoceSabiaId = keyof typeof VOCE_SABIA

const CHAVE = 'tarefinha-dica-' // + id: já dispensada neste aparelho
const OFF = 'tarefinha-dicas-off'
const ULTIMA = 'tarefinha-dicas-ultima' // quando o último cartão foi dispensado
const TUTORIAL = 'tarefinha-tutorial-visto'
const ESPERA_CARTAO = 24 * 60 * 60 * 1000
const AUTO_DISPENSAR = 20_000
const VISIVEL_MIN = 0.55 // quanto do alvo precisa estar na tela para o balão valer

function ler(chave: string): string | null {
  try { return localStorage.getItem(chave) } catch { return null }
}
function gravar(chave: string, valor: string) {
  try { localStorage.setItem(chave, valor) } catch {}
}
function apagar(chave: string) {
  try { localStorage.removeItem(chave) } catch {}
}

// Quem está na tela querendo aparecer. Só ocupa uma vaga se estiver visível (um balão dentro da
// pílula do celular não conta no computador, onde a pílula fica escondida).
type Registro = { tipo: TipoDica; prioridade: number }
const registro = new Map<string, Registro>()
const ouvintes = new Set<() => void>()
let dispensouNestaAbertura = false

function avisar() {
  ouvintes.forEach((f) => f())
}
// Para quem muda uma condição das dicas fora daqui (o tutorial, ao ser fechado).
export const reavaliarDicas = avisar

function assinar(cb: () => void) {
  ouvintes.add(cb)
  window.addEventListener('storage', cb)
  return () => {
    ouvintes.delete(cb)
    window.removeEventListener('storage', cb)
  }
}

// O id da única dica que pode aparecer agora, ou null.
function escolhida(): string | null {
  if (dispensouNestaAbertura) return null
  if (ler(OFF) === '1' || ler(TUTORIAL) !== '1') return null
  const cartaoEmEspera = Date.now() - (Number(ler(ULTIMA)) || 0) < ESPERA_CARTAO
  let melhor: { id: string; ordem: number } | null = null
  for (const [id, r] of registro) {
    if (ler(CHAVE + id) === '1') continue
    if (r.tipo === 'sabia' && cartaoEmEspera) continue
    const ordem = (r.tipo === 'toque' ? 0 : 1000) + r.prioridade
    if (!melhor || ordem < melhor.ordem || (ordem === melhor.ordem && id < melhor.id)) melhor = { id, ordem }
  }
  return melhor ? melhor.id : null
}

function dispensar(id: string, tipo: TipoDica) {
  gravar(CHAVE + id, '1')
  if (tipo === 'sabia') gravar(ULTIMA, String(Date.now()))
  dispensouNestaAbertura = true
  avisar()
}

// Usado por ToqueAqui e VoceSabia. Com "alvo", só conta enquanto o elemento estiver visível na
// tela (escondido por CSS, ou abaixo da dobra, não ocupa a vaga nem gasta o tempo do balão).
// "margem" encolhe a área considerada visível, para sobrar espaço ao balão e não ficar sob a barra.
export function useDica(
  id: string,
  tipo: TipoDica,
  prioridade: number,
  quando: boolean,
  alvo?: RefObject<HTMLElement | null>,
  margem = '0px',
) {
  const escolha = useSyncExternalStore(assinar, escolhida, () => null)

  useEffect(() => {
    if (!quando) return
    let ativo = false
    const marcar = (visivel: boolean) => {
      if (visivel === ativo) return
      ativo = visivel
      if (visivel) registro.set(id, { tipo, prioridade })
      else registro.delete(id)
      avisar()
    }
    const el = alvo?.current
    if (!el) {
      marcar(true)
      return () => marcar(false)
    }
    const obs = new IntersectionObserver(
      (entradas) => marcar(entradas[entradas.length - 1].intersectionRatio >= VISIVEL_MIN),
      { threshold: VISIVEL_MIN, rootMargin: margem },
    )
    obs.observe(el)
    return () => {
      obs.disconnect()
      marcar(false)
    }
  }, [id, tipo, prioridade, quando, alvo, margem])

  const fechar = useCallback(() => dispensar(id, tipo), [id, tipo])
  // "quando" também vale aqui: com várias instâncias do mesmo id (uma por tarefa, por exemplo),
  // só a que pediu para aparecer mostra o balão.
  return { visivel: quando && escolha === id, dispensar: fechar }
}

// Some depois de um toque no alvo (a pessoa já achou) ou de 20 segundos na tela.
export function useDispensarAoTocar(alvo: HTMLElement | null | undefined, ativa: boolean, fechar: () => void) {
  useEffect(() => {
    if (!ativa || !alvo) return
    alvo.addEventListener('click', fechar, { once: true })
    const t = setTimeout(fechar, AUTO_DISPENSAR)
    return () => {
      alvo.removeEventListener('click', fechar)
      clearTimeout(t)
    }
  }, [alvo, ativa, fechar])
}

// Interruptor "Dicas" (menu Mais e barra lateral). Ligar de novo volta a mostrar as já dispensadas.
export function useDicasLigadas() {
  return useSyncExternalStore(assinar, () => ler(OFF) !== '1', () => true)
}
export function definirDicas(ligadas: boolean) {
  if (ligadas) {
    apagar(OFF)
    apagar(ULTIMA)
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i)
        if (k && k.startsWith(CHAVE)) localStorage.removeItem(k)
      }
    } catch {}
    dispensouNestaAbertura = false
  } else {
    gravar(OFF, '1')
  }
  avisar()
}
