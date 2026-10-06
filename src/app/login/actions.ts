'use server'

import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'

export async function signIn(
  _prev: { error: string } | null,
  formData: FormData
) {
  const { error } = await auth.signIn.email({
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  })

  if (error) {
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
  const { error } = await auth.signUp.email({
    name: String(formData.get('name') ?? '').trim() || 'Responsável',
    email: String(formData.get('email') ?? ''),
    password,
  })
  if (error) {
    return { error: error.message || 'Não foi possível criar a conta.' }
  }
  redirect('/pais')
}
