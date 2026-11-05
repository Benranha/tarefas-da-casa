'use client'

import { useActionState } from 'react'
import { savePhoneAction } from '../login/actions'
import PhoneInput from '@/components/PhoneInput'
import { TfLoader } from '@/components/TfLoader'
import AuthShell from '@/components/AuthShell'

export default function PhoneForm() {
  const [state, action, pending] = useActionState(savePhoneAction, null)

  return (
    <AuthShell title="Seu telefone" subtitle="Falta só isso para abrir o painel." icon="recado">
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
    </AuthShell>
  )
}
