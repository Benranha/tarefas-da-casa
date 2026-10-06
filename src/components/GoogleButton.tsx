'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth/client'

export default function GoogleButton({ label }: { label: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    const { error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: `${window.location.origin}/pais`,
    })
    // Em caso de sucesso o navegador é redirecionado para o Google.
    if (error) {
      setError('Não foi possível entrar com o Google.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full py-4 bg-white text-gray-700 font-bold rounded-2xl border-2 border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-60"
      >
        {loading ? 'Abrindo o Google...' : label}
      </button>
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
    </div>
  )
}
