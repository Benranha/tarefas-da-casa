'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { TfLoader } from '@/components/TfLoader'
import AuthShell from '@/components/AuthShell'

function VerifyForm() {
  const router = useRouter()
  const email = useSearchParams().get('email') ?? ''
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!email) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-ink-muted">Não sabemos qual e-mail confirmar.</p>
        <Link href="/login" className="block font-bold text-ink">
          Ir para o login
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInfo(null)
    const { data, error } = await authClient.emailOtp.verifyEmail({ email, otp: code.trim() })
    if (error) {
      setError('Código inválido ou expirado. Confira ou peça um novo.')
      setLoading(false)
      return
    }
    // Com login automático a sessão já existe; senão, volta para entrar.
    router.push(data?.token ? '/pais' : '/login')
    router.refresh()
  }

  async function resend() {
    setError(null)
    setInfo(null)
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' })
    if (error) setError('Não foi possível reenviar agora. Tente de novo em instantes.')
    else setInfo('Enviamos um novo código. Ele vale por 15 minutos.')
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <p className="text-center text-ink-muted">
        Enviamos um código para <strong>{email}</strong>. Digite abaixo para confirmar o e-mail.
      </p>
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        required
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Código de 6 dígitos"
        className="w-full p-3 text-center text-2xl tracking-widest rounded-2xl border-2 border-line focus:border-brand outline-none transition-all"
      />
      {error && <p className="text-sm text-returned-fg text-center">{error}</p>}
      {info && <p className="text-sm text-approved-fg text-center">{info}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 flex items-center justify-center gap-2 bg-brand text-on-brand font-bold rounded-2xl hover:bg-brand-hover transition-colors shadow-lg disabled:opacity-60"
      >
        {loading && <TfLoader size={24} tone="on-brand" decorative />}
        {loading ? 'Confirmando...' : 'Confirmar e-mail'}
      </button>
      <div className="flex justify-between text-sm">
        <button type="button" onClick={resend} className="font-bold text-brand">
          Reenviar código
        </button>
        <Link href="/login" className="font-bold text-ink">
          Voltar ao login
        </Link>
      </div>
      <p className="text-xs text-center text-ink-muted">Não chegou? Veja a caixa de spam.</p>
    </form>
  )
}

export default function VerifyEmailPage() {
  return (
    <AuthShell title="Confirme seu e-mail" icon="recado">
        <Suspense fallback={null}>
          <VerifyForm />
        </Suspense>
    </AuthShell>
  )
}
