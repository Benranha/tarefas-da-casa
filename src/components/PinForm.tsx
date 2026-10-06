'use client'

import { useState } from 'react'

// Código secreto da criança: na primeira vez ela escolhe (e repete); depois só digita.
export default function PinForm({
  creating,
  onSubmit,
  big = false,
}: {
  creating: boolean
  onSubmit: (pin: string) => Promise<string | null>
  big?: boolean
}) {
  const [pin, setPin] = useState('')
  const [again, setAgain] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!/^\d{4,8}$/.test(pin)) return setError('Use de 4 a 8 números.')
    if (creating && pin !== again) return setError('Os dois códigos precisam ser iguais.')
    setBusy(true)
    const err = await onSubmit(pin)
    setBusy(false)
    if (err) {
      setError(err)
      setPin('')
      setAgain('')
    }
  }

  const field = `w-full text-center tracking-[0.5em] rounded-full border-2 border-line-strong ${
    big ? 'text-4xl py-4' : 'text-2xl py-3'
  }`

  return (
    <form onSubmit={submit} className="w-full max-w-sm space-y-4">
      <label className="block">
        <span className={`block text-center font-extrabold text-ink mb-2 ${big ? 'text-2xl' : 'text-lg'}`}>
          {creating ? 'Escolha seu código secreto' : 'Digite seu código'}
        </span>
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          maxLength={8}
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          className={field}
          aria-label="Código"
        />
      </label>
      {creating && (
        <label className="block">
          <span className={`block text-center font-bold text-ink-muted mb-2 ${big ? 'text-xl' : 'text-base'}`}>
            Digite de novo
          </span>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            maxLength={8}
            value={again}
            onChange={(e) => setAgain(e.target.value.replace(/\D/g, ''))}
            className={field}
            aria-label="Repita o código"
          />
        </label>
      )}
      {creating && (
        <p className="text-center text-sm text-ink-muted">
          De 4 a 8 números. Guarde bem: só você vai poder mexer nas suas tarefas.
        </p>
      )}
      {error && (
        <p role="alert" className="text-center font-bold text-returned-fg">
          {error}
        </p>
      )}
      <button disabled={busy} className={`tf-btn tf-btn--primary w-full ${big ? 'tf-btn--totem' : ''}`}>
        {busy ? 'Entrando...' : creating ? 'Salvar e entrar' : 'Entrar'}
      </button>
    </form>
  )
}
