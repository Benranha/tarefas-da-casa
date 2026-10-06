import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { sql } from '@/lib/db'

// Acesso da criança: um PIN que ela escolhe na primeira vez. Depois do PIN o servidor entrega
// um token assinado (HMAC) que vale só para aquela criança. Tanto o totem (token curto, fica
// só na tela) quanto o aparelho próprio (token longo) usam o mesmo mecanismo, então um irmão
// não consegue mexer nas tarefas do outro.

export const TOTEM_TTL = 12 * 60 * 60 // segundos
export const DEVICE_TTL = 180 * 24 * 60 * 60
export const TOKEN_HEADER = 'x-child-token'

const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 5

const secret = () => process.env.NEON_AUTH_COOKIE_SECRET!
const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url')
// Amarra o token ao PIN atual: se os pais redefinirem o PIN, os tokens antigos deixam de valer.
const fingerprint = (pinHash: string) => createHash('sha256').update(pinHash).digest('hex').slice(0, 12)

export function hashPin(pin: string) {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(pin, salt, 32).toString('hex')}`
}

export function checkPin(pin: string, stored: string) {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const given = scryptSync(pin, salt, 32)
  const expected = Buffer.from(hash, 'hex')
  return given.length === expected.length && timingSafeEqual(given, expected)
}

function issueToken(childId: string, pinHash: string, ttl: number) {
  const payload = `${childId}.${Math.floor(Date.now() / 1000) + ttl}.${fingerprint(pinHash)}`
  return `${payload}.${sign(payload)}`
}

export type AuthedChild = {
  id: string
  owner_id: string
  name: string
  avatar: string | null
  color: string | null
  points: number
  has_device: boolean
  wake_time: string
  bed_time: string
}

// Criança dona do token enviado no cabeçalho, ou null.
export async function childFromRequest(request: Request): Promise<AuthedChild | null> {
  const token = request.headers.get(TOKEN_HEADER) ?? ''
  const [childId, exp, fp, sig] = token.split('.')
  if (!childId || !exp || !fp || !sig) return null
  const expected = sign(`${childId}.${exp}.${fp}`)
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  if (Number(exp) < Date.now() / 1000) return null
  if (!/^[0-9a-f-]{36}$/i.test(childId)) return null

  const rows = await sql`
    SELECT id, owner_id, name, avatar, color, points, has_device, pin_hash,
           to_char(wake_time, 'HH24:MI') AS wake_time, to_char(bed_time, 'HH24:MI') AS bed_time
    FROM children WHERE id = ${childId}::uuid
  `
  const row = rows[0]
  if (!row?.pin_hash || fingerprint(row.pin_hash) !== fp) return null
  delete row.pin_hash
  return row as AuthedChild
}

type PinResult =
  | { ok: true; token: string; created: boolean }
  | { ok: false; status: 401 | 423 | 409; error: string }

// Primeira vez (sem PIN): grava o PIN escolhido. Depois: confere, com bloqueio após erros seguidos.
export async function authenticatePin(childId: string, pin: string, ttl: number): Promise<PinResult> {
  const rows = await sql`
    SELECT pin_hash, pin_attempts,
           pin_locked_until IS NOT NULL AND pin_locked_until > now() AS locked
    FROM children WHERE id = ${childId}::uuid
  `
  const child = rows[0]
  if (!child) return { ok: false, status: 401, error: 'Criança não encontrada' }

  if (!child.pin_hash) {
    const hash = hashPin(pin)
    const set = await sql`
      UPDATE children SET pin_hash = ${hash}, pin_attempts = 0, pin_locked_until = NULL
      WHERE id = ${childId}::uuid AND pin_hash IS NULL RETURNING id
    `
    if (set.length === 0) return { ok: false, status: 409, error: 'Esta criança já tem um código. Digite o código.' }
    return { ok: true, token: issueToken(childId, hash, ttl), created: true }
  }

  if (child.locked) {
    return { ok: false, status: 423, error: `Muitas tentativas. Espere ${LOCK_MINUTES} minutos ou peça aos pais.` }
  }
  if (!checkPin(pin, child.pin_hash)) {
    await sql`
      UPDATE children SET
        pin_attempts = CASE WHEN pin_attempts + 1 >= ${MAX_ATTEMPTS} THEN 0 ELSE pin_attempts + 1 END,
        pin_locked_until = CASE WHEN pin_attempts + 1 >= ${MAX_ATTEMPTS}
          THEN now() + ${`${LOCK_MINUTES} minutes`}::interval ELSE pin_locked_until END
      WHERE id = ${childId}::uuid
    `
    return { ok: false, status: 401, error: 'Código errado' }
  }
  await sql`UPDATE children SET pin_attempts = 0, pin_locked_until = NULL WHERE id = ${childId}::uuid`
  return { ok: true, token: issueToken(childId, child.pin_hash, ttl), created: false }
}
