import { createHmac, timingSafeEqual } from 'node:crypto'
import { SITE_URL } from '@/lib/site'

// Token do link "Parar de receber": é a assinatura do id da família, então o link de uma família não
// serve para mexer em outra. O segredo vem de EMAIL_TOKEN_SECRET. Sem ele os e-mails de dica não saem:
// melhor não mandar do que mandar sem um jeito de parar.

const segredo = () => process.env.EMAIL_TOKEN_SECRET || null

export const temSegredo = () => !!segredo()

export function tokenParar(ownerId: string): string | null {
  const s = segredo()
  return s ? createHmac('sha256', s).update(`parar:${ownerId}`).digest('base64url') : null
}

export function tokenPararValido(ownerId: string, token: string): boolean {
  const esperado = tokenParar(ownerId)
  if (!esperado || !token) return false
  const a = Buffer.from(esperado)
  const b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}

// pagina: a tela com o botão de confirmar (para a pessoa). api: o endereço que o Gmail e outros leitores
// chamam com um toque (List-Unsubscribe-Post). Nenhum dos dois muda nada só por abrir o link.
export function linksParar(ownerId: string): { pagina: string; api: string } | null {
  const t = tokenParar(ownerId)
  if (!t) return null
  const q = `f=${ownerId}&t=${t}`
  return { pagina: `${SITE_URL}/email/parar?${q}`, api: `${SITE_URL}/api/email/parar?${q}` }
}
