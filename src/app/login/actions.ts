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
