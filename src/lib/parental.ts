import { createHmac, timingSafeEqual } from 'node:crypto'
import { sql } from '@/lib/db'
import { checkPin } from '@/lib/child-auth'

// Código parental: os pais definem em Família e ele protege o "Trocar modo" do totem.
// Quem acerta recebe um token curto (HMAC) que o /abrir exige para reconfigurar o tablet.

const TOKEN_TTL = 2 * 60 // segundos
const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 5

const sign = (payload: string) =>
  createHmac('sha256', process.env.NEON_AUTH_COOKIE_SECRET!).update(payload).digest('base64url')

const issue = (code: string) => {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL
  return `${exp}.${sign(`parental.${code}.${exp}`)}`
}

export function tokenValid(code: string, token: string) {
  const [exp, sig] = token.split('.')
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false
  const expected = sign(`parental.${code}.${exp}`)
  return sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
}

export async function parentalRequired(code: string) {
  const rows = await sql`SELECT (parental_pin_hash IS NOT NULL) AS required FROM families WHERE totem_code = ${code}`
  return rows.length ? Boolean(rows[0].required) : null
}

export type ParentalResult =
  | { ok: true; required: boolean; token: string }
  | { ok: false; status: 401 | 404 | 423; error: string }

// Confere o código parental do totem. Sem código definido, libera (comportamento antigo).
export async function verifyParental(code: string, pin: string): Promise<ParentalResult> {
  const rows = await sql`
    SELECT parental_pin_hash AS hash,
           parental_locked_until IS NOT NULL AND parental_locked_until > now() AS locked
    FROM families WHERE totem_code = ${code}
  `
  const fam = rows[0]
  if (!fam) return { ok: false, status: 404, error: 'Totem não encontrado' }
  if (!fam.hash) return { ok: true, required: false, token: issue(code) }
  if (fam.locked) {
    return { ok: false, status: 423, error: `Muitas tentativas. Espere ${LOCK_MINUTES} minutos.` }
  }
  if (!checkPin(pin, fam.hash)) {
    await sql`
      UPDATE families SET
        parental_attempts = CASE WHEN parental_attempts + 1 >= ${MAX_ATTEMPTS} THEN 0 ELSE parental_attempts + 1 END,
        parental_locked_until = CASE WHEN parental_attempts + 1 >= ${MAX_ATTEMPTS}
          THEN now() + ${`${LOCK_MINUTES} minutes`}::interval ELSE parental_locked_until END
      WHERE totem_code = ${code}
    `
    return { ok: false, status: 401, error: 'Código errado' }
  }
  await sql`UPDATE families SET parental_attempts = 0, parental_locked_until = NULL WHERE totem_code = ${code}`
  return { ok: true, required: true, token: issue(code) }
}
