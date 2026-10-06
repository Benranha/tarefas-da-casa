'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn } from './actions'

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBFA] p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-[32px] shadow-sm border-2 border-[#EEDCDF]">
        <h1 className="text-3xl font-bold text-center text-[#5C4033] mb-8">
          Login dos Pais
        </h1>
        <form className="space-y-6" action={action}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              name="email"
              required
              className="w-full p-3 rounded-2xl border-2 border-gray-200 focus:border-[#5C4033] outline-none transition-all"
              placeholder="email@exemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              name="password"
              required
              className="w-full p-3 rounded-2xl border-2 border-gray-200 focus:border-[#5C4033] outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          {state?.error && <p className="text-sm text-red-600 text-center">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full py-4 bg-[#5C4033] text-white font-bold rounded-2xl hover:bg-[#4A3329] transition-colors shadow-lg disabled:opacity-60"
          >
            {pending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          Primeira vez?{' '}
          <Link href="/cadastro" className="font-bold text-[#5C4033]">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
