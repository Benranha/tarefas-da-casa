import { esc } from './html'

// Layout único dos e-mails do Tarefinha: tabela com estilo em linha (os leitores de e-mail ignoram
// CSS externo), uma coluna só, botão grande e um bloco opcional "Você sabia?".
// Os textos que entram aqui seguem docs/vendas/escrita.md: frases curtas, uma ideia, sem travessão.

const COR = { marca: '#c0430e', texto: '#3a2a22', suave: '#6a554a', fundo: '#fff8ef', dica: '#fff1c7', dicaBorda: '#ffc93c', linha: '#ebdccb' }
const FONTE = 'Arial,Helvetica,sans-serif'

export type Botao = { texto: string; url: string }

export type EmailEntrada = {
  assunto: string // vira o <title>; o assunto do envio é definido por quem chama
  preheader: string // a linha que o leitor de e-mail mostra ao lado do assunto
  titulo: string
  paragrafos: string[]
  botao?: Botao
  apoioBotao?: string // uma linha logo abaixo do botão: o que fazer ao tocar
  apoioBotaoTexto?: string // a mesma linha na versão em texto puro, que não tem botão, só o link
  dica?: { texto: string; botao?: Botao } // bloco "Você sabia?"
  rodape: string[]
  parar?: string // endereço para parar de receber; só nos e-mails de dica
}

function botaoHtml(b: Botao) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:12px;background:${COR.marca}"><a href="${esc(b.url)}" style="display:inline-block;padding:14px 24px;font-family:${FONTE};font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:12px">${esc(b.texto)}</a></td></tr></table>`
}

export function montarEmail(e: EmailEntrada): { html: string; text: string } {
  const p = (t: string) => `<p style="margin:0 0 14px;font-size:16px;line-height:24px;color:${COR.texto}">${esc(t)}</p>`
  const pequeno = (t: string) => `<p style="margin:0 0 6px;font-size:13px;line-height:19px;color:${COR.suave}">${esc(t)}</p>`

  const dica = e.dica
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0"><tr><td style="background:${COR.dica};border-left:4px solid ${COR.dicaBorda};border-radius:8px;padding:14px 16px">
<p style="margin:0 0 4px;font-size:15px;line-height:20px;font-weight:bold;color:${COR.texto}">Você sabia?</p>
<p style="margin:0;font-size:15px;line-height:22px;color:${COR.texto}">${esc(e.dica.texto)}</p>${
        e.dica.botao
          ? `\n<p style="margin:10px 0 0;font-size:15px;line-height:22px"><a href="${esc(e.dica.botao.url)}" style="color:${COR.marca};font-weight:bold">${esc(e.dica.botao.texto)}</a></p>`
          : ''
      }
</td></tr></table>`
    : ''

  const parar = e.parar
    ? `<p style="margin:10px 0 0;font-size:13px;line-height:19px;color:${COR.suave}">Para parar de receber estas dicas, <a href="${esc(e.parar)}" style="color:${COR.suave}">toque aqui</a>.</p>`
    : ''

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${esc(e.assunto)}</title>
</head>
<body style="margin:0;padding:0;background:${COR.fundo}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px">${esc(e.preheader)}${'&nbsp;&zwnj;'.repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COR.fundo}"><tr><td align="center" style="padding:24px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px"><tr><td style="font-family:${FONTE}">
<p style="margin:0 0 20px;font-size:20px;font-weight:bold;color:${COR.marca}">Tarefinha</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:2px solid ${COR.linha};border-radius:16px"><tr><td style="padding:24px 22px;font-family:${FONTE}">
<h1 style="margin:0 0 14px;font-size:24px;line-height:30px;color:${COR.marca}">${esc(e.titulo)}</h1>
${e.paragrafos.map(p).join('\n')}${
    e.botao
      ? `\n<div style="margin:20px 0 8px">${botaoHtml(e.botao)}</div>${
          e.apoioBotao ? `\n<p style="margin:0;font-size:14px;line-height:20px;color:${COR.suave}">${esc(e.apoioBotao)}</p>` : ''
        }\n<p style="margin:8px 0 0;font-size:12px;line-height:18px;color:${COR.suave};word-break:break-all">Se o botão não abrir, copie este endereço: ${esc(e.botao.url)}</p>`
      : ''
  }
${dica}
</td></tr></table>
<div style="padding:16px 4px 0;font-family:${FONTE}">
${e.rodape.map(pequeno).join('\n')}${parar}
</div>
</td></tr></table>
</td></tr></table>
</body>
</html>`

  const linhas = [e.titulo, '', ...e.paragrafos.flatMap((t) => [t, ''])]
  if (e.botao) {
    linhas.push(`${e.botao.texto}: ${e.botao.url}`)
    if (e.apoioBotao) linhas.push(e.apoioBotaoTexto ?? e.apoioBotao)
    linhas.push('')
  }
  if (e.dica) {
    linhas.push('Você sabia?', e.dica.texto)
    if (e.dica.botao) linhas.push(`${e.dica.botao.texto}: ${e.dica.botao.url}`)
    linhas.push('')
  }
  linhas.push(...e.rodape)
  if (e.parar) linhas.push('', `Para parar de receber estas dicas, use este link: ${e.parar}`)
  return { html, text: linhas.join('\n') }
}
