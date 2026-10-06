'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }
    router.push('/pais')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBFA] p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-[32px] shadow-sm border-2 border-[#EEDCDF]">
        <h1 className="text-3xl font-bold text-center text-[#5C4033] mb-8">
          Login dos Pais
        </h1>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-2xl border-2 border-gray-200 focus:border-[#5C4033] outline-none transition-all"
              placeholder="email@exemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-2xl border-2 border-gray-200 focus:border-[#5C4033] outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#5C4033] text-white font-bold rounded-2xl hover:bg-[#4A3329] transition-colors shadow-lg disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          Problemas com o acesso? Entre em contato com o administrador.
        </p>
      </div>
    </div>
  )
}
