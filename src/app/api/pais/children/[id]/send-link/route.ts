import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getFamily } from '@/lib/auth/server'
import { UUID, badRequest, notFound, unauthorized } from '@/lib/http'

export const dynamic = 'force-dynamic'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const COOLDOWN_MS = 60_000

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

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

  const key = process.env.RESEND_API_KEY
  if (!key) return NextResponse.json({ error: 'O envio de e-mail ainda não foi configurado.' }, { status: 503 })

  const name = child.name as string
  const link = `${new URL(request.url).origin}/filho?c=${child.invite_code}`
  const from = process.env.RESEND_FROM || 'Tarefinha <onboarding@resend.dev>'
  const parent = family.userName.trim()
  const intro = parent ? `${parent} mandou o link do Tarefinha para você ver suas tarefas.` : 'Aqui está o link do Tarefinha para você ver suas tarefas.'
  const text = `Oi, ${name}!\n\n${intro}\n\nAbra o link: ${link}\n\nNa primeira vez você escolhe um código secreto de 4 a 8 números. Depois, se quiser, instale o app na tela inicial para receber lembretes.\n\nNão compartilhe este link com outras pessoas.`
  const html = `<div style="font-family:Arial,sans-serif;color:#3a2a22;max-width:480px">
<h2 style="color:#c0430e">Oi, ${esc(name)}!</h2>
<p>${esc(intro)}</p>
<p><a href="${esc(link)}" style="display:inline-block;background:#c0430e;color:#fff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:12px">Abrir minhas tarefas</a></p>
<p>Na primeira vez você escolhe um código secreto de 4 a 8 números. Depois, se quiser, instale o app na tela inicial para receber lembretes.</p>
<p style="color:#6a554a;font-size:13px">Não compartilhe este link com outras pessoas.</p></div>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from, to: [email], subject: `${name}, seu link do Tarefinha`, html, text }),
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) throw new Error(`Resend ${res.status} ${(await res.text()).slice(0, 200)}`)
  } catch (e) {
    console.error('send-link:', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'Não foi possível enviar o e-mail agora. Confira o endereço e tente de novo.' }, { status: 502 })
  }

  await sql`
    UPDATE children SET invite_email = ${email}, invite_sent_at = now()
    WHERE id = ${id}::uuid AND owner_id = ${family.ownerId}::uuid
  `
  return NextResponse.json({ ok: true, email })
}
