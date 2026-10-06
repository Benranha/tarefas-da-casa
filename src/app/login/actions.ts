'use server'

import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'

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
  redirect('/login')
}

export async function signUp(
  _prev: { error: string } | null,
  formData: FormData
) {
  const password = String(formData.get('password') ?? '')
  if (password.length < 8) {
    return { error: 'A senha precisa ter pelo menos 8 caracteres.' }
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
  // Com verificação ativa não há sessão até confirmar o e-mail: segue para o código.
  const hasSession = Boolean((data as { token?: string | null } | null)?.token)
  if (!hasSession && !data?.user?.emailVerified) {
    redirect(`/verificar-email?email=${encodeURIComponent(email)}`)
  }
  redirect('/pais')
}
