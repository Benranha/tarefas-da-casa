'use client'

import { Suspense, useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import GoogleButton from '@/components/GoogleButton'
import { signIn } from './actions'

function ResetNotice() {
  const params = useSearchParams()
  if (params.get('senha') !== 'redefinida') return null
  return <p className="text-sm text-approved-fg text-center bg-approved-bg rounded-2xl p-3 mb-6">Senha alterada! Entre com a nova senha.</p>
}

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="max-w-md w-full bg-surface-raised p-8 rounded-[32px] shadow-sm border-2 border-line">
        <h1 className="text-3xl font-bold text-center text-ink mb-8">
          Login dos Pais
        </h1>
        <Suspense fallback={null}>
          <ResetNotice />
        </Suspense>
        <form className="space-y-6" action={action}>
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">E-mail</label>
            <input
              type="email"
              name="email"
              required
              className="w-full p-3 rounded-2xl border-2 border-line focus:border-brand outline-none transition-all"
              placeholder="email@exemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1">Senha</label>
            <input
              type="password"
              name="password"
              required
              className="w-full p-3 rounded-2xl border-2 border-line focus:border-brand outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <div className="text-right -mt-3">
            <Link href="/esqueci-senha" className="text-sm font-bold text-brand">
              Esqueci a senha
            </Link>
          </div>
          {state?.error && <p className="text-sm text-returned-fg text-center">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full py-4 bg-brand text-on-brand font-bold rounded-2xl hover:bg-brand-hover transition-colors shadow-lg disabled:opacity-60"
          >
            {pending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <div className="flex items-center gap-3 my-6 text-sm text-ink-muted">
          <div className="flex-1 h-px bg-line" />
          ou
          <div className="flex-1 h-px bg-line" />
        </div>
        <GoogleButton label="Entrar com o Google" />
        <p className="mt-6 text-center text-sm text-ink-muted">
          Primeira vez?{' '}
          <Link href="/cadastro" className="font-bold text-ink">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
