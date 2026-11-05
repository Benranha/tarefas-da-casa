'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import GoogleButton from '@/components/GoogleButton'
import { signUp } from '../login/actions'
import PhoneInput from '@/components/PhoneInput'
import { TfLoader } from '@/components/TfLoader'
import { rememberAuthMethod } from '@/lib/analytics'

const input = 'w-full p-3 rounded-2xl border-2 border-line focus:border-brand outline-none transition-all'

// Criar a conta com o Google é o caminho principal (o telefone é pedido logo depois, em /telefone).
// E-mail e senha ficam num link discreto embaixo e já pedem o telefone no próprio formulário.
export default function SignUpPage() {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(signUp, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="max-w-md w-full bg-surface-raised p-8 rounded-[32px] shadow-sm border-2 border-line">
        <h1 className="text-3xl font-bold text-center text-ink mb-2">Criar conta</h1>
        <p className="text-center text-ink-muted mb-8">
          Para pais e responsáveis. Use a sua conta do Google; em seguida pedimos o seu telefone.
        </p>
        <GoogleButton label="Continuar com o Google" />

        {!open ? (
          <p className="mt-6 text-center text-sm text-ink-muted">
            Prefere e-mail e senha?{' '}
            <button type="button" onClick={() => setOpen(true)} className="font-bold text-ink underline underline-offset-4">
              Criar com e-mail
            </button>
          </p>
        ) : (
          <>
            <div className="flex items-center gap-3 my-6 text-sm text-ink-muted">
              <div className="flex-1 h-px bg-line" />
              ou com e-mail e senha
              <div className="flex-1 h-px bg-line" />
            </div>
            <form className="space-y-4" action={action} onSubmit={() => rememberAuthMethod('email')}>
              <input name="name" required autoComplete="name" aria-label="Seu nome" className={input} placeholder="Seu nome" />
              <input name="email" type="email" required autoComplete="email" aria-label="E-mail" className={input} placeholder="email@exemplo.com" />
              <PhoneInput name="phone" required aria-label="Telefone" className={input} placeholder="(92) 99999-9999" />
              <input
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                aria-label="Senha"
                className={input}
                placeholder="Senha (mínimo 8 caracteres)"
              />
              {state?.error && <p className="text-sm text-returned-fg text-center">{state.error}</p>}
              <button
                type="submit"
                disabled={pending}
                className="w-full py-3 flex items-center justify-center gap-2 bg-surface-raised text-ink font-bold rounded-2xl border-2 border-line hover:bg-surface-sunken transition-colors disabled:opacity-60"
              >
                {pending && <TfLoader size={22} decorative />}
                {pending ? 'Criando...' : 'Criar conta com e-mail'}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-ink-muted">Teste grátis por 30 dias, sem cartão de crédito.</p>
        <p className="mt-3 text-center text-sm text-ink-muted">
          Já tem conta?{' '}
          <Link href="/login" className="font-bold text-ink">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
