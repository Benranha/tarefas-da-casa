'use client'

import { useState } from 'react'
import Link from 'next/link'
import { authClient } from '@/lib/auth/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    setLoading(false)
    // Mesma resposta exista a conta ou não, para não revelar quem tem cadastro.
    if (error && error.status && error.status >= 500) {
      setError('Não foi possível enviar agora. Tente novamente em instantes.')
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="max-w-md w-full bg-surface-raised p-8 rounded-[32px] shadow-sm border-2 border-line">
        <h1 className="text-3xl font-bold text-center text-ink mb-2">Esqueci a senha</h1>
        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-ink-muted mt-4">
              Se existir uma conta com esse e-mail, enviamos um link para criar uma nova senha. O link vale por 15
              minutos. Confira também a caixa de spam.
            </p>
            <Link href="/login" className="block font-bold text-ink">
              Voltar para o login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-center text-ink-muted mb-8">Informe o e-mail da sua conta.</p>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="w-full p-3 rounded-2xl border-2 border-line focus:border-brand outline-none transition-all"
              />
              {error && <p className="text-sm text-returned-fg text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-brand text-on-brand font-bold rounded-2xl hover:bg-brand-hover transition-colors shadow-lg disabled:opacity-60"
              >
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-ink-muted">
              <Link href="/login" className="font-bold text-ink">
                Voltar para o login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
