'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Invite({ code, loggedIn }: { code: string; loggedIn: boolean }) {
  const router = useRouter()
  const [from, setFrom] = useState<string | null>(null)
  const [invalid, setInvalid] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Guarda o convite para o painel dos pais trazer a pessoa de volta depois de entrar ou criar a conta.
  useEffect(() => {
    document.cookie = `tarefinha-convite=${code}; path=/; max-age=86400; SameSite=Lax`
    fetch(`/api/pais/convite?c=${code}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setFrom(d.from || 'Alguém'))
      .catch(() => {
        document.cookie = 'tarefinha-convite=; path=/; max-age=0'
        setInvalid(true)
      })
  }, [code])

  async function accept() {
    setBusy(true)
    setError(null)
    const res = await fetch('/api/pais/convite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ c: code }),
    })
    if (res.ok) {
      document.cookie = 'tarefinha-convite=; path=/; max-age=0'
      router.push('/pais/familia')
      router.refresh()
      return
    }
    document.cookie = 'tarefinha-convite=; path=/; max-age=0'
    const data = await res.json().catch(() => ({}))
    setError(data.error || 'Convite inválido ou já usado.')
    setBusy(false)
  }

  if (invalid) {
    return <p className="text-center text-ink-muted">Este convite não existe, já foi usado ou expirou. Peça um novo.</p>
  }
  if (from === null) return <p className="text-center text-ink-muted">Carregando...</p>

  return (
    <div className="space-y-5 text-center">
      <p className="text-ink">
        <strong>{from}</strong> convidou você para cuidar das tarefas da família no Tarefinha.
      </p>
      {loggedIn ? (
        <>
          <button onClick={accept} disabled={busy} className="tf-btn tf-btn--primary w-full">
            {busy ? 'Entrando...' : 'Entrar na família'}
          </button>
          {error && <p className="text-sm text-returned-fg">{error}</p>}
        </>
      ) : (
        <div className="space-y-3">
          <Link href="/cadastro" className="tf-btn tf-btn--primary w-full">Criar minha conta</Link>
          <Link href="/login" className="tf-btn tf-btn--secondary w-full">Já tenho conta</Link>
        </div>
      )}
    </div>
  )
}
