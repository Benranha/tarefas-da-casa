'use server'

import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { parsePhone, savePhone } from '@/lib/telefone'

export async function signOut() {
  await auth.signOut()
  // Volta para a escolha de modo (app ou painel); o /abrir cuida de pedir o login se for app.
  redirect('/abrir?trocar=1')
}

// Quem entrou com o Google (ou já tinha conta) informa o telefone antes de usar o painel.
export async function savePhoneAction(
  _prev: { error: string } | null,
  formData: FormData
) {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/login')
  const phone = parsePhone(String(formData.get('phone') ?? ''))
  if (!phone) {
    return { error: 'Informe um telefone válido, com DDD. Ex.: (92) 99999-9999.' }
  }
  try {
    await savePhone(session.user.id, phone)
  } catch (e) {
    console.error('Não foi possível salvar o telefone', e)
    return { error: 'Não foi possível salvar o telefone. Tente de novo.' }
  }
  redirect('/pais')
}
