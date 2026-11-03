import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/server'
import { hasPhone } from '@/lib/telefone'
import PhoneForm from './PhoneForm'

export const dynamic = 'force-dynamic'

export default async function PhonePage() {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/login')
  if (await hasPhone(session.user.id)) redirect('/pais')
  return <PhoneForm />
}
