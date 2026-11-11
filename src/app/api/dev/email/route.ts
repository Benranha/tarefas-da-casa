import { linkCrianca } from '@/lib/email/modelos'

export const dynamic = 'force-dynamic'

// Pré-visualização dos e-mails, só para desenvolvimento (em produção responde 404).
// /api/dev/email                              lista os modelos
// /api/dev/email?modelo=link-crianca          o HTML
// /api/dev/email?modelo=link-crianca&formato=texto   a versão em texto puro
// Os dados são de exemplo: nenhum nome, e-mail ou link de família real.
const EXEMPLOS: Record<string, () => { assunto: string; html: string; text: string }> = {
  'link-crianca': () =>
    linkCrianca({
      nomeCrianca: 'Theo',
      nomeResponsavel: 'Lucas',
      link: 'https://exemplo.com.br/filho?c=00000000000000000000000000000000',
    }),
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') return new Response(null, { status: 404 })
  const params = new URL(request.url).searchParams
  const modelo = EXEMPLOS[params.get('modelo') ?? '']
  if (!modelo) return Response.json({ modelos: Object.keys(EXEMPLOS) })

  const m = modelo()
  const cabecalhos = { 'x-assunto': encodeURIComponent(m.assunto), 'x-tamanho-html': String(Buffer.byteLength(m.html)) }
  if (params.get('formato') === 'texto') {
    return new Response(m.text, { headers: { 'content-type': 'text/plain; charset=utf-8', ...cabecalhos } })
  }
  return new Response(m.html, { headers: { 'content-type': 'text/html; charset=utf-8', ...cabecalhos } })
}
