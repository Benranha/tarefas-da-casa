import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { UUID, badRequest, notFound, unauthorized } from '@/lib/http'
import { enviarEmail } from '@/lib/email/enviar'
import { linkCrianca } from '@/lib/email/modelos'

export const dynamic = 'force-dynamic'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const COOLDOWN_MS = 60_000

// Envia (ou reenvia) por e-mail o link da criança. Sem "email" no corpo, reenvia para o e-mail já guardado.
// O e-mail só é guardado depois que o envio dá certo.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const { id } = await params
  if (!UUID.test(id)) return badRequest()

  const body = await request.json().catch(() => ({}))
  const typed = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (typed && (typed.length > 254 || !EMAIL.test(typed))) return badRequest('Esse e-mail não parece válido.')

  const rows = await sql`
    SELECT name, has_device, invite_code, invite_email,
           (invite_sent_at IS NOT NULL AND invite_sent_at > now() - make_interval(secs => ${COOLDOWN_MS / 1000})) AS too_soon
    FROM children WHERE id = ${id}::uuid AND owner_id = ${family.ownerId}::uuid
  `
  const child = rows[0]
  if (!child) return notFound()
  if (!child.has_device) return badRequest('Marque “Tem celular ou computador” antes de enviar o link.')

  const email = typed || (child.invite_email as string | null)
  if (!email) return badRequest('Informe o e-mail da criança.')
  if (child.too_soon) {
    return NextResponse.json({ error: 'Já enviamos há instantes. Espere um minuto para enviar de novo.' }, { status: 429 })
  }

  const link = `${new URL(request.url).origin}/filho?c=${child.invite_code}`
  const msg = linkCrianca({ nomeCrianca: child.name as string, nomeResponsavel: family.userName, link })
  const envio = await enviarEmail({ to: email, subject: msg.assunto, html: msg.html, text: msg.text })
  if (!envio.ok) {
    if (envio.motivo === 'sem-chave') return NextResponse.json({ error: 'O envio de e-mail ainda não foi configurado.' }, { status: 503 })
    return NextResponse.json({ error: 'Não foi possível enviar o e-mail agora. Confira o endereço e tente de novo.' }, { status: 502 })
  }

  await sql`
    UPDATE children SET invite_email = ${email}, invite_sent_at = now()
    WHERE id = ${id}::uuid AND owner_id = ${family.ownerId}::uuid
  `
  return NextResponse.json({ ok: true, email })
}
