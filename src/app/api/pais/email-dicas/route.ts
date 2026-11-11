import { NextResponse } from 'next/server'
import { getFamily } from '@/lib/auth/server'
import { dicasLigadas, salvarDicas } from '@/lib/email/preferencias'
import { emailsLigados } from '@/lib/email/rotina'
import { badRequest, unauthorized } from '@/lib/http'

export const dynamic = 'force-dynamic'

// Se a família quer receber dicas por e-mail. A preferência é da família (de quem criou), e qualquer
// responsável pode mudar. "ativo" diz se o app está mandando esses e-mails (EMAIL_DICAS=1): a tela
// em Família só aparece quando sim.
export async function GET() {
  const family = await getFamily()
  if (!family) return unauthorized()
  const ativo = emailsLigados()
  try {
    return NextResponse.json({ ativo, dicas: await dicasLigadas(family.ownerId) })
  } catch {
    // Migration 008 ainda não aplicada: sem tabela, não há o que ajustar.
    return NextResponse.json({ ativo: false, dicas: true })
  }
}

export async function POST(request: Request) {
  const family = await getFamily()
  if (!family) return unauthorized()
  const body = await request.json().catch(() => ({}))
  if (typeof body.dicas !== 'boolean') return badRequest()
  try {
    await salvarDicas(family.ownerId, body.dicas)
  } catch (e) {
    console.error('email-dicas:', e instanceof Error ? e.message.slice(0, 200) : e)
    return NextResponse.json({ error: 'Não foi possível salvar agora.' }, { status: 503 })
  }
  return NextResponse.json({ dicas: body.dicas })
}
