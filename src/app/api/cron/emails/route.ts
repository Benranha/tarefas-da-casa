import { NextResponse } from 'next/server'
import { rodarEmails } from '@/lib/email/rotina'

export const dynamic = 'force-dynamic'

// E-mails ao responsável (boas-vindas que não saíram na hora, "sem uso" e dicas). Chame uma vez por
// dia, com o mesmo CRON_SECRET do /api/cron/lembretes. Só sai e-mail com EMAIL_DICAS=1.
//
// ?dry=1 não envia nada: devolve só quantos e-mails de cada tipo sairiam. Use antes de ligar o
// EMAIL_DICAS. A resposta nunca traz endereço de e-mail nem id de família.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const dry = new URL(request.url).searchParams.get('dry') === '1'
  try {
    return NextResponse.json(await rodarEmails({ dry }))
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('cron/emails:', msg.slice(0, 300))
    if (/email_log|email_preferencias/.test(msg)) {
      return NextResponse.json({ error: 'Aplique db/migrations/008_emails.sql no Neon antes.' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Não foi possível montar a lista de e-mails.' }, { status: 500 })
  }
}
