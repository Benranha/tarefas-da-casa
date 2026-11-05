'use client'

import { Suspense, useActionState, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import GoogleButton from '@/components/GoogleButton'
import { signIn } from './actions'
import { TfLoader } from '@/components/TfLoader'
import AuthShell from '@/components/AuthShell'

const input = 'w-full p-3 rounded-2xl border-2 border-line focus:border-brand outline-none transition-all'

// O Google é o caminho principal; e-mail e senha ficam num link discreto embaixo.
// Volta já aberto quando a pessoa acabou de trocar a senha (?senha=redefinida).
function EmailLogin() {
  const params = useSearchParams()
  const reset = params.get('senha') === 'redefinida'
  const [open, setOpen] = useState(reset)
  const [state, action, pending] = useActionState(signIn, null)

  if (!open) {
    return (
      <p className="mt-6 text-center text-sm text-ink-muted">
        Prefere e-mail e senha?{' '}
        <button type="button" onClick={() => setOpen(true)} className="font-bold text-ink underline underline-offset-4">
          Entrar com e-mail
        </button>
      </p>
    )
  }

  return (
    <>
      <div className="flex items-center gap-3 my-6 text-sm text-ink-muted">
        <div className="flex-1 h-px bg-line" />
        ou com e-mail e senha
        <div className="flex-1 h-px bg-line" />
      </div>
      {reset && (
        <p className="text-sm text-approved-fg text-center bg-approved-bg rounded-2xl p-3 mb-4">Senha alterada! Entre com a nova senha.</p>
      )}
      <form className="space-y-4" action={action}>
        <input type="email" name="email" required autoComplete="email" aria-label="E-mail" className={input} placeholder="email@exemplo.com" />
        <input type="password" name="password" required autoComplete="current-password" aria-label="Senha" className={input} placeholder="Senha" />
        <div className="text-right -mt-1">
          <Link href="/esqueci-senha" className="text-sm font-bold text-brand">
            Esqueci a senha
          </Link>
        </div>
        {state?.error && <p className="text-sm text-returned-fg text-center">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full py-3 flex items-center justify-center gap-2 bg-surface-raised text-ink font-bold rounded-2xl border-2 border-line hover:bg-surface-sunken transition-colors disabled:opacity-60"
        >
          {pending && <TfLoader size={22} decorative />}
          {pending ? 'Entrando...' : 'Entrar com e-mail'}
        </button>
      </form>
    </>
  )
}

export default function LoginPage() {
  return (
    <AuthShell title="Login dos pais" subtitle="Entre com a sua conta do Google." icon="menina">
        <GoogleButton label="Entrar com o Google" />
        <Suspense fallback={null}>
          <EmailLogin />
        </Suspense>
        <p className="mt-6 text-center text-sm text-ink-muted">
          Primeira vez?{' '}
          <Link href="/cadastro" className="font-bold text-ink">
            Criar conta
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-ink-muted">
          Este aparelho é o tablet das crianças?{' '}
          <Link href="/abrir?trocar=1" className="font-bold text-ink">
            Usar como painel
          </Link>
        </p>
    </AuthShell>
  )
}
