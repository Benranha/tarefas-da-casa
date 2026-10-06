import webpush from 'web-push'
import { sql } from '@/lib/db'

// Notificações push (PWA). Sem as chaves VAPID no ambiente, tudo vira no-op.
// Gere com: npx web-push generate-vapid-keys
export const vapidPublicKey = () => process.env.VAPID_PUBLIC_KEY ?? ''

let configured = false
function ready() {
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return false
  if (!configured) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:contato@tarefinha.app', pub, priv)
    configured = true
  }
  return true
}

export type PushPayload = { title: string; body: string; url?: string; tag?: string }
type Sub = { id: string; endpoint: string; p256dh: string; auth: string }

async function deliver(subs: Sub[], payload: PushPayload) {
  if (!subs.length || !ready()) return
  const body = JSON.stringify(payload)
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body)
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        // Inscrição expirada ou revogada: remove.
        if (status === 404 || status === 410) await sql`DELETE FROM push_subscriptions WHERE id = ${s.id}::uuid`
      }
    }),
  )
}

export async function notifyChild(childId: string, payload: PushPayload) {
  if (!ready()) return
  const subs = await sql`SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE child_id = ${childId}::uuid`
  await deliver(subs as Sub[], payload)
}

// Todos os responsáveis da família (quem criou + quem entrou por convite).
export async function notifyParents(ownerId: string, payload: PushPayload) {
  if (!ready()) return
  const subs = await sql`
    SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth FROM push_subscriptions ps
    WHERE ps.user_id = ${ownerId}::uuid
       OR ps.user_id IN (SELECT user_id FROM family_members WHERE family_owner_id = ${ownerId}::uuid)
  `
  await deliver(subs as Sub[], payload)
}

export function parseSubscription(body: unknown) {
  const b = body as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null
  const endpoint = typeof b?.endpoint === 'string' ? b.endpoint : ''
  const p256dh = typeof b?.keys?.p256dh === 'string' ? b.keys.p256dh : ''
  const auth = typeof b?.keys?.auth === 'string' ? b.keys.auth : ''
  if (!endpoint.startsWith('https://') || endpoint.length > 1000 || !p256dh || !auth) return null
  return { endpoint, p256dh, auth }
}
