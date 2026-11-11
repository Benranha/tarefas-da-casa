import { NextResponse } from 'next/server'
import { salvarDicas } from '@/lib/email/preferencias'
import { tokenPararValido } from '@/lib/email/token'
import { UUID } from '@/lib/http'

export const dynamic = 'force-dynamic'

// Um toque para parar: é o endereço do cabeçalho List-Unsubscribe-Post, que o Gmail e o Apple Mail
// chamam quando a pessoa toca em "Cancelar inscrição". Só responde a POST: abrir este endereço no
// navegador (GET) não muda nada. Para a pessoa, o link do e-mail leva à página /email/parar.
export async function POST(request: Request) {
  const params = new URL(request.url).searchParams
  const f = params.get('f') ?? ''
  const t = params.get('t') ?? ''
  if (!UUID.test(f) || !tokenPararValido(f, t)) return NextResponse.json({ error: 'Link inválido.' }, { status: 400 })
  try {
    await salvarDicas(f, false)
  } catch (e) {
    console.error('email/parar:', e instanceof Error ? e.message.slice(0, 200) : e)
    return NextResponse.json({ error: 'Não foi possível agora. Tente de novo.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
