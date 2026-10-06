'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import GoogleButton from '@/components/GoogleButton'
import { signUp } from '../login/actions'

const input =
  'w-full p-3 rounded-2xl border-2 border-line focus:border-brand outline-none transition-all'

export default function SignUpPage() {
  const [state, action, pending] = useActionState(signUp, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="max-w-md w-full bg-surface-raised p-8 rounded-[32px] shadow-sm border-2 border-line">
        <h1 className="text-3xl font-bold text-center text-ink mb-2">Criar conta</h1>
        <p className="text-center text-ink-muted mb-8">Para pais e responsáveis</p>
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
          {state?.error && <p className="text-sm text-returned-fg text-center">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full py-4 bg-brand text-on-brand font-bold rounded-2xl hover:bg-brand-hover transition-colors shadow-lg disabled:opacity-60"
          >
            {pending ? 'Criando...' : 'Criar conta'}
          </button>
        </form>
        <div className="flex items-center gap-3 my-6 text-sm text-ink-muted">
          <div className="flex-1 h-px bg-line" />
          ou
          <div className="flex-1 h-px bg-line" />
        </div>
        <GoogleButton label="Criar conta com o Google" />
        <p className="mt-6 text-center text-sm text-ink-muted">
          Já tem conta?{' '}
          <Link href="/login" className="font-bold text-ink">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
