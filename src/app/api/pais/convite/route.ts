import { NextResponse, type NextRequest } from 'next/server'
import { sql } from '@/lib/db'
import { auth } from '@/lib/auth/server'
import { CHILD_INVITE, badRequest, conflict, notFound, unauthorized } from '@/lib/http'

export const dynamic = 'force-dynamic'

// Quem convidou, para a tela do convite (público: só mostra o primeiro nome do convidante).
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('c') ?? ''
  if (!CHILD_INVITE.test(code)) return notFound()
  const rows = await sql`
    SELECT u.name FROM family_invites i
    JOIN neon_auth."user" u ON u.id = i.family_owner_id
    WHERE i.code = ${code} AND i.used_at IS NULL AND i.expires_at > now()
  `
  return rows.length ? NextResponse.json({ from: String(rows[0].name ?? '').split(' ')[0] }) : notFound()
}

// Aceita o convite: o usuário logado passa a fazer parte da família.
export async function POST(request: Request) {
  const { data: session } = await auth.getSession()
  const user = session?.user
  if (!user) return unauthorized()
  const body = await request.json().catch(() => ({}))
  const code = typeof body.c === 'string' ? body.c : ''
  if (!CHILD_INVITE.test(code)) return badRequest()

  // Quem já tem filhos cadastrados na própria família não pode trocar de família sem perder dados.
  const own = await sql`SELECT 1 FROM children WHERE owner_id = ${user.id}::uuid LIMIT 1`
  if (own.length) {
    return conflict('Sua conta já tem filhos cadastrados em outra família. Use uma conta nova para entrar nesta.')
  }

  const rows = await sql`
    WITH inv AS (
      UPDATE family_invites SET used_at = now()
      WHERE code = ${code} AND used_at IS NULL AND expires_at > now()
        AND family_owner_id <> ${user.id}::uuid
      RETURNING family_owner_id
    ),
    mem AS (
      INSERT INTO family_members (user_id, family_owner_id)
      SELECT ${user.id}::uuid, family_owner_id FROM inv
      ON CONFLICT (user_id) DO UPDATE SET family_owner_id = EXCLUDED.family_owner_id
      RETURNING family_owner_id
    )
    SELECT family_owner_id FROM mem
  `
  if (rows.length === 0) return notFound()
  return NextResponse.json({ ok: true })
}
