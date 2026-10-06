import { auth } from '@/lib/auth/server'
import Invite from './Invite'

export const dynamic = 'force-dynamic'

export default async function InvitePage({ searchParams }: PageProps<'/convite'>) {
  const c = (await searchParams).c
  const code = typeof c === 'string' ? c : ''
  const { data: session } = await auth.getSession()

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="max-w-md w-full bg-surface-raised p-8 rounded-[32px] shadow-sm border-2 border-line space-y-6">
        <h1 className="text-3xl font-bold text-center text-ink">Convite para a família</h1>
        <Invite code={code} loggedIn={Boolean(session?.user)} />
      </div>
    </div>
  )
}
