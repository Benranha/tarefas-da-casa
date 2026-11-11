import { redirect } from 'next/navigation'
import Link from 'next/link'
import AuthShell from '@/components/AuthShell'
import { salvarDicas } from '@/lib/email/preferencias'
import { tokenPararValido } from '@/lib/email/token'
import { UUID } from '@/lib/http'
import { privatePage } from '@/lib/noindex'

export const metadata = privatePage('Parar de receber dicas')
export const dynamic = 'force-dynamic'

// Para onde vai o link "Parar de receber" dos e-mails de dica. Abrir o link não muda nada: quem muda é
// o botão, porque antivírus e leitores de e-mail abrem links sozinhos e cancelariam sem ninguém pedir.
async function parar(form: FormData) {
  'use server'
  const f = String(form.get('f') ?? '')
  const t = String(form.get('t') ?? '')
  if (!UUID.test(f) || !tokenPararValido(f, t)) redirect('/email/parar')
  await salvarDicas(f, false)
  redirect(`/email/parar?f=${f}&t=${t}&feito=1`)
}

export default async function PararPage({ searchParams }: PageProps<'/email/parar'>) {
  const sp = await searchParams
  const f = typeof sp.f === 'string' ? sp.f : ''
  const t = typeof sp.t === 'string' ? sp.t : ''
  const valido = UUID.test(f) && tokenPararValido(f, t)

  if (!valido) {
    return (
      <AuthShell title="Este link não vale" icon="recado" subtitle="Use o link que está no fim do e-mail. Se preferir, dá para ajustar em Família, no painel.">
        <Link href="/pais/familia" className="tf-btn tf-btn--primary w-full">
          Abrir Família
        </Link>
      </AuthShell>
    )
  }

  if (sp.feito === '1') {
    return (
      <AuthShell
        title="Pronto"
        icon="estrela"
        subtitle="Você não vai mais receber dicas por e-mail. Se mudar de ideia, ligue de novo em Família, no painel."
      >
        <Link href="/pais" className="tf-btn tf-btn--primary w-full">
          Abrir o Tarefinha
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Parar de receber dicas"
      icon="recado"
      subtitle="Toque no botão para confirmar. Os e-mails que você pede, como o link da criança, continuam chegando."
    >
      <form action={parar}>
        <input type="hidden" name="f" value={f} />
        <input type="hidden" name="t" value={t} />
        <button className="tf-btn tf-btn--primary w-full">Parar de receber</button>
      </form>
    </AuthShell>
  )
}
