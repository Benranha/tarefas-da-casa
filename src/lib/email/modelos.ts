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
