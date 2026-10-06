'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth/client'

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
        <p className="text-gray-600">Não sabemos qual e-mail confirmar.</p>
        <Link href="/login" className="block font-bold text-[#5C4033]">
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
      <p className="text-center text-gray-600">
        Enviamos um código para <strong>{email}</strong>. Digite abaixo para confirmar o e-mail.
      </p>
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        required
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Código de 6 dígitos"
        className="w-full p-3 text-center text-2xl tracking-widest rounded-2xl border-2 border-gray-200 focus:border-[#5C4033] outline-none transition-all"
      />
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      {info && <p className="text-sm text-green-700 text-center">{info}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-[#5C4033] text-white font-bold rounded-2xl hover:bg-[#4A3329] transition-colors shadow-lg disabled:opacity-60"
      >
        {loading ? 'Confirmando...' : 'Confirmar e-mail'}
      </button>
      <div className="flex justify-between text-sm">
        <button type="button" onClick={resend} className="font-bold text-[#5C4033]">
          Reenviar código
        </button>
        <Link href="/login" className="font-bold text-[#5C4033]">
          Voltar ao login
        </Link>
      </div>
      <p className="text-xs text-center text-gray-400">Não chegou? Veja a caixa de spam.</p>
    </form>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBFA] p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-[32px] shadow-sm border-2 border-[#EEDCDF]">
        <h1 className="text-3xl font-bold text-center text-[#5C4033] mb-8">Confirme seu e-mail</h1>
        <Suspense fallback={null}>
          <VerifyForm />
        </Suspense>
      </div>
    </div>
  )
}
