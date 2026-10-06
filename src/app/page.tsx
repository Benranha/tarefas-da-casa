import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { data: session } = await auth.getSession()
  if (session?.user) redirect('/pais')

  return (
    <div className="min-h-screen bg-[#FDFBFA] flex items-center justify-center p-6">
      <main className="max-w-md w-full bg-white p-10 rounded-[32px] shadow-sm border-2 border-[#EEDCDF] text-center space-y-6">
        <div className="text-6xl">🏠</div>
        <h1 className="text-3xl font-bold text-[#5C4033]">Tarefas da Casa</h1>
        <p className="text-gray-500">
          Tarefas domésticas em forma de jogo: as crianças ganham pontos e os pais aprovam.
        </p>
        <div className="space-y-3">
          <Link
            href="/cadastro"
            className="block w-full py-4 bg-[#5C4033] text-white font-bold rounded-2xl hover:bg-[#4A3329] transition-colors shadow-lg"
          >
            Criar conta
          </Link>
          <Link
            href="/login"
            className="block w-full py-4 bg-white text-[#5C4033] font-bold rounded-2xl border-2 border-[#EEDCDF] hover:bg-gray-50 transition-colors"
          >
            Entrar
          </Link>
        </div>
      </main>
    </div>
  )
}
