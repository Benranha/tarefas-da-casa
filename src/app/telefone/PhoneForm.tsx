'use client'

import { useActionState } from 'react'
import { savePhoneAction } from '../login/actions'
import PhoneInput from '@/components/PhoneInput'
import { TfLoader } from '@/components/TfLoader'

export default function PhoneForm() {
  const [state, action, pending] = useActionState(savePhoneAction, null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="max-w-md w-full bg-surface-raised p-8 rounded-[32px] shadow-sm border-2 border-line">
        <h1 className="text-3xl font-bold text-center text-ink mb-2">Seu telefone</h1>
        <p className="text-center text-ink-muted mb-8">Falta só isso para abrir o painel.</p>
        <form className="space-y-5" action={action}>
          <PhoneInput
            name="phone"
            required
            autoFocus
            className="w-full p-3 rounded-2xl border-2 border-line focus:border-brand outline-none transition-all"
            placeholder="(92) 99999-9999"
          />
          {state?.error && <p className="text-sm text-returned-fg text-center">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full py-4 flex items-center justify-center gap-2 bg-brand text-on-brand font-bold rounded-2xl hover:bg-brand-hover transition-colors shadow-lg disabled:opacity-60"
          >
            {pending && <TfLoader size={24} tone="on-brand" decorative />}
            {pending ? 'Salvando...' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  )
}
