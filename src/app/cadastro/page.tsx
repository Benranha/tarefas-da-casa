'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp } from '../login/actions'

const input =
  'w-full p-3 rounded-2xl border-2 border-gray-200 focus:border-[#5C4033] outline-none transition-all'

export default function SignUpPage() {
  const [state, action, pending] = useActionState(signUp, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBFA] p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-[32px] shadow-sm border-2 border-[#EEDCDF]">
        <h1 className="text-3xl font-bold text-center text-[#5C4033] mb-2">Criar conta</h1>
        <p className="text-center text-gray-500 mb-8">Para pais e responsáveis</p>
        <form className="space-y-5" action={action}>
          <input name="name" required className={input} placeholder="Seu nome" />
          <input name="email" type="email" required className={input} placeholder="email@exemplo.com" />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className={input}
            placeholder="Senha (mínimo 8 caracteres)"
          />
          {state?.error && <p className="text-sm text-red-600 text-center">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full py-4 bg-[#5C4033] text-white font-bold rounded-2xl hover:bg-[#4A3329] transition-colors shadow-lg disabled:opacity-60"
          >
            {pending ? 'Criando...' : 'Criar conta'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-500">
          Já tem conta?{' '}
          <Link href="/login" className="font-bold text-[#5C4033]">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
