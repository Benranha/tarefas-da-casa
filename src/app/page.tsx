import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { data: session } = await auth.getSession()
  if (session?.user) redirect('/pais')

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <main className="max-w-md w-full bg-surface-raised p-10 rounded-[32px] shadow-sm border-2 border-line text-center space-y-6">
        <div className="text-6xl">🏠</div>
        <h1 className="text-3xl font-bold text-ink">Tarefinha</h1>
        <p className="text-ink-muted">
          Tarefas domésticas em forma de jogo: as crianças ganham pontos e os pais aprovam.
        </p>
        <div className="space-y-3">
          <Link
            href="/cadastro"
            className="block w-full py-4 bg-brand text-on-brand font-bold rounded-2xl hover:bg-brand-hover transition-colors shadow-lg"
          >
            Criar conta
          </Link>
          <Link
            href="/login"
            className="block w-full py-4 bg-surface-raised text-ink font-bold rounded-2xl border-2 border-line hover:bg-surface-sunken transition-colors"
          >
            Entrar
          </Link>
        </div>
      </main>
    </div>
  )
}
