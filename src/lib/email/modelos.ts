import { montarEmail } from './layout'

// Os e-mails do app. Cada um é uma função pura: recebe os dados e devolve assunto, HTML e texto.
// Texto que o responsável ou a criança lê segue docs/vendas/escrita.md.

// Link da criança, enviado quando o responsável toca em "Enviar link por e-mail".
// É um e-mail do uso do app (a pessoa pediu agora), por isso não leva "parar de receber".
export function linkCrianca(d: { nomeCrianca: string; nomeResponsavel: string; link: string }) {
  const responsavel = d.nomeResponsavel.trim()
  const intro = responsavel
    ? `${responsavel} mandou o link do Tarefinha para você ver suas tarefas.`
    : 'Aqui está o link do Tarefinha para você ver suas tarefas.'
  const assunto = `${d.nomeCrianca}, seu link do Tarefinha`
  const { html, text } = montarEmail({
    assunto,
    preheader: 'Toque no botão para ver as suas tarefas.',
    titulo: `Oi, ${d.nomeCrianca}!`,
    paragrafos: [intro],
    botao: { texto: 'Abrir minhas tarefas', url: d.link },
    apoioBotao: 'Toque no botão. Na primeira vez você escolhe um código secreto de 4 a 8 números.',
    apoioBotaoTexto: 'Toque no link. Na primeira vez você escolhe um código secreto de 4 a 8 números.',
    dica: { texto: 'Dá para instalar o Tarefinha na tela inicial do celular e receber um lembrete na hora de cada tarefa.' },
    rodape: ['Não compartilhe este link com outras pessoas.', 'Você recebeu este e-mail porque um responsável pediu para enviar o seu link.'],
  })
  return { assunto, html, text }
}

// ---- E-mails ao responsável (boas-vindas, "sem uso" e dicas) ----
// Todos levam o link para parar de receber. Cada um tem uma ideia só (docs/vendas/escrita.md).

const RODAPE_CONTA = 'Você recebeu este e-mail porque criou uma conta no Tarefinha.'

type Novidade = { assunto: string; texto: string; botao: string }
const minuscula = (t: string) => t.charAt(0).toLowerCase() + t.slice(1)

// Logo depois que a primeira tarefa fica pronta. Mostra o ciclo e uma dica: o assistente
// (só se o servidor tem o assistente ligado, senão a dica prometeria algo que não funciona).
export function boasVindas(d: { nome: string; abrir: string; parar: string; assistente: boolean }) {
  const primeiro = d.nome.trim().split(/\s+/)[0]
  const assunto = 'Seu Tarefinha está pronto'
  const { html, text } = montarEmail({
    assunto,
    preheader: 'A criança marca, você aprova.',
    titulo: primeiro ? `Oi, ${primeiro}!` : 'Oi!',
    paragrafos: ['Você cadastrou a primeira tarefa. Agora a criança marca quando terminar, e você aprova. Os pontos só valem depois da sua aprovação.'],
    botao: { texto: 'Abrir a Fila', url: d.abrir },
    apoioBotao: 'Toque no botão. As tarefas que a criança marcar aparecem lá para você aprovar.',
    apoioBotaoTexto: 'Toque no link. As tarefas que a criança marcar aparecem lá para você aprovar.',
    dica: d.assistente
      ? {
          texto: 'Você pode pedir ao assistente do painel para criar tarefas. Escreva uma frase e toque em Confirmar.',
          botao: { texto: 'Toque aqui para experimentar', url: d.abrir },
        }
      : undefined,
    rodape: [RODAPE_CONTA],
    parar: d.parar,
  })
  return { assunto, html, text }
}

// Faz alguns dias sem uso e há tarefas feitas esperando aprovação: o motivo mais útil para voltar.
export function semUsoAprovacao(d: { abrir: string; parar: string }) {
  const assunto = 'Tem tarefas esperando você aprovar'
  const { html, text } = montarEmail({
    assunto,
    preheader: 'Os pontos só entram depois da sua aprovação.',
    titulo: 'Tem tarefas esperando',
    paragrafos: ['Tem tarefas marcadas como feitas esperando a sua aprovação. Os pontos só entram depois que você aprova.'],
    botao: { texto: 'Abrir a Fila', url: d.abrir },
    apoioBotao: 'Toque no botão para ver o que está esperando.',
    apoioBotaoTexto: 'Toque no link para ver o que está esperando.',
    rodape: [RODAPE_CONTA],
    parar: d.parar,
  })
  return { assunto, html, text }
}

// Faz alguns dias sem uso e nada esperando: um convite para voltar, com uma dica se houver alguma.
export function semUsoDica(d: { abrir: string; parar: string; novidade?: Novidade & { url: string } }) {
  const assunto = 'Faz alguns dias sem uso no Tarefinha'
  const { html, text } = montarEmail({
    assunto,
    preheader: 'Se a rotina mudou, dá para ajustar as tarefas.',
    titulo: 'Faz alguns dias sem uso',
    paragrafos: ['Faz alguns dias que ninguém usa o Tarefinha. Se a rotina da casa mudou, dá para ajustar as tarefas em poucos toques.'],
    botao: { texto: 'Abrir o Tarefinha', url: d.abrir },
    apoioBotao: 'Toque no botão para ver as tarefas de hoje.',
    apoioBotaoTexto: 'Toque no link para ver as tarefas de hoje.',
    dica: d.novidade
      ? { texto: d.novidade.texto, botao: { texto: `Toque aqui para ${minuscula(d.novidade.botao)}`, url: d.novidade.url } }
      : undefined,
    rodape: [RODAPE_CONTA],
    parar: d.parar,
  })
  return { assunto, html, text }
}

// Uma funcionalidade por e-mail, a que a família ainda não usa.
export function novidade(d: { novidade: Novidade; url: string; parar: string }) {
  const assunto = d.novidade.assunto
  const { html, text } = montarEmail({
    assunto,
    preheader: d.novidade.texto.split('. ')[0].replace(/\.?$/, '.'),
    titulo: 'Você sabia?',
    paragrafos: [d.novidade.texto],
    botao: { texto: d.novidade.botao, url: d.url },
    apoioBotao: 'Toque no botão para abrir essa tela.',
    apoioBotaoTexto: 'Toque no link para abrir essa tela.',
    rodape: [RODAPE_CONTA],
    parar: d.parar,
  })
  return { assunto, html, text }
}
