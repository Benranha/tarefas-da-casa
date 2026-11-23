import { NextResponse } from 'next/server'
import { getAdmin } from '@/lib/admin'
import { unauthorized } from '@/lib/http'
import { enviarEmail, remetente } from '@/lib/email/enviar'
import { emailTeste } from '@/lib/email/modelos'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

// Manda um e-mail de teste para quem está logado como admin. O destino vem da sessão, nunca do corpo da
// requisição: o botão não serve para escrever a ninguém. Só o admin vê o motivo da falha (resposta do Resend).
export async function POST() {
  const admin = await getAdmin()
  if (!admin) return unauthorized()

  const msg = emailTeste({ abrir: `${SITE_URL}/admin`, remetente: remetente() })
  const envio = await enviarEmail({ to: admin.email, subject: msg.assunto, html: msg.html, text: msg.text })
  if (!envio.ok) {
    if (envio.motivo === 'sem-chave') {
      return NextResponse.json({ error: 'A RESEND_API_KEY não está definida neste ambiente.' }, { status: 503 })
    }
    const motivo = envio.detalhe ? ` Resposta: ${envio.detalhe}` : ''
    return NextResponse.json({ error: `O Resend não aceitou o envio.${motivo}` }, { status: 502 })
  }
  return NextResponse.json({ ok: true, para: admin.email })
}
