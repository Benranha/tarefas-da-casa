'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth/client'

function ResetForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-ink-muted mt-4">Este link é inválido ou expirou.</p>
        <Link href="/esqueci-senha" className="block font-bold text-ink">
          Pedir um novo link
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) return setError('A senha precisa ter pelo menos 8 caracteres.')
    if (password !== confirm) return setError('As senhas não conferem.')
    setLoading(true)
    setError(null)
    const { error } = await authClient.resetPassword({ newPassword: password, token: token! })
    if (error) {
      setError('Este link é inválido ou expirou. Peça um novo.')
      setLoading(false)
      return
    }
    router.push('/login?senha=redefinida')
  }

  const input =
    'w-full p-3 rounded-2xl border-2 border-line focus:border-brand outline-none transition-all'

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <input
        type="password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Nova senha (mínimo 8 caracteres)"
        className={input}
      />
      <input
        type="password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Repita a nova senha"
        className={input}
      />
      {error && <p className="text-sm text-returned-fg text-center">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-brand text-on-brand font-bold rounded-2xl hover:bg-brand-hover transition-colors shadow-lg disabled:opacity-60"
      >
        {loading ? 'Salvando...' : 'Salvar nova senha'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="max-w-md w-full bg-surface-raised p-8 rounded-[32px] shadow-sm border-2 border-line">
        <h1 className="text-3xl font-bold text-center text-ink mb-8">Nova senha</h1>
        <Suspense fallback={null}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
