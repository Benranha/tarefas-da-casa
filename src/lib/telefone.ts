import { sql } from '@/lib/db'

// Telefone brasileiro: só dígitos, com DDD (10 ou 11). Aceita +55 e máscara, e devolve só o número com DDD.
export function parsePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, '')
  if (digits.length > 11 && digits.startsWith('55')) digits = digits.slice(2)
  return /^[1-9]{2}9?\d{8}$/.test(digits) ? digits : null
}

export async function savePhone(userId: string, phone: string) {
  await sql`
    INSERT INTO user_phones (user_id, phone) VALUES (${userId}::uuid, ${phone})
    ON CONFLICT (user_id) DO UPDATE SET phone = EXCLUDED.phone
  `
}

// Se a pessoa já informou o telefone. Se a tabela ainda não existe (migração 007 não aplicada),
// considera que sim, para não travar o painel de todo mundo.
export async function hasPhone(userId: string): Promise<boolean> {
  try {
    const rows = await sql`SELECT 1 FROM user_phones WHERE user_id = ${userId}::uuid`
    return rows.length > 0
  } catch (e) {
    console.error('Não foi possível consultar user_phones', e)
    return true
  }
}
