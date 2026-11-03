'use server'

import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { sql } from '@/lib/db'

// Telefone brasileiro: só dígitos, com DDD (10 ou 11). Aceita +55 e máscara, e devolve só o número com DDD.
function parsePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, '')
  if (digits.length > 11 && digits.startsWith('55')) digits = digits.slice(2)
  return /^[1-9]{2}9?\d{8}$/.test(digits) ? digits : null
}

export async function signIn(
  _prev: { error: string } | null,
  formData: FormData
) {
  const email = String(formData.get('email') ?? '')
  const { error } = await auth.signIn.email({
    email,
    password: String(formData.get('password') ?? ''),
  })

  if (error) {
    // E-mail ainda não confirmado: leva para a tela do código (o Neon reenvia o código).
    if (error.status === 403 || String(error.code ?? '').includes('EMAIL_NOT_VERIFIED')) {
      redirect(`/verificar-email?email=${encodeURIComponent(email)}`)
    }
    return { error: 'E-mail ou senha inválidos.' }
  }
  redirect('/pais')
}

export async function signOut() {
  await auth.signOut()
  // Volta para a escolha de modo (app ou painel); o /abrir cuida de pedir o login se for app.
  redirect('/abrir?trocar=1')
}

export async function signUp(
  _prev: { error: string } | null,
  formData: FormData
) {
  const password = String(formData.get('password') ?? '')
  if (password.length < 8) {
    return { error: 'A senha precisa ter pelo menos 8 caracteres.' }
  }
  const phone = parsePhone(String(formData.get('phone') ?? ''))
  if (!phone) {
    return { error: 'Informe um telefone válido, com DDD. Ex.: (92) 99999-9999.' }
  }
  const email = String(formData.get('email') ?? '')
  const { data, error } = await auth.signUp.email({
    name: String(formData.get('name') ?? '').trim() || 'Responsável',
    email,
    password,
  })
  if (error) {
    return { error: error.message || 'Não foi possível criar a conta.' }
  }
  // Guarda o telefone; se falhar, a conta já existe e não deve travar o cadastro.
  if (data?.user?.id) {
    try {
      await sql`
        INSERT INTO user_phones (user_id, phone) VALUES (${data.user.id}::uuid, ${phone})
        ON CONFLICT (user_id) DO UPDATE SET phone = EXCLUDED.phone
      `
    } catch (e) {
      console.error('Não foi possível salvar o telefone do cadastro', e)
    }
  }
  // Com verificação ativa não há sessão até confirmar o e-mail: segue para o código.
  const hasSession = Boolean((data as { token?: string | null } | null)?.token)
  if (!hasSession && !data?.user?.emailVerified) {
    redirect(`/verificar-email?email=${encodeURIComponent(email)}`)
  }
  redirect('/pais')
}
