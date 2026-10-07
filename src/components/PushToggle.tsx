'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(padded)
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

// Liga/desliga as notificações deste aparelho. `endpoint` é a rota que guarda a inscrição e
// `headers` leva a autenticação (o token da criança, quando for o caso).
export default function PushToggle({
  endpoint,
  headers = {},
  className = '',
}: {
  endpoint: string
  headers?: Record<string, string>
  className?: string
}) {
  const [state, setState] = useState<'loading' | 'unsupported' | 'off' | 'on' | 'denied'>('loading')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setState('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setState('denied')
      return
    }
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? 'on' : 'off'))
      .catch(() => setState('unsupported'))
  }, [])

  async function enable() {
    setBusy(true)
    setError(null)
    try {
      const { key } = await (await fetch('/api/push/key', { cache: 'no-store' })).json()
      if (!key) throw new Error('As notificações ainda não foram configuradas no servidor.')
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'off')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      }).catch(() => {
        // O navegador recusou cadastrar o aparelho no serviço de push (mensagem dele vem em inglês).
        throw new Error(
          'Seu navegador não conseguiu ativar as notificações. No Brave, ligue "Use Google services for push messaging" em brave://settings/privacy e reinicie; ou tente em outro navegador (Chrome).',
        )
      })
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(sub.toJSON()),
      })
      if (!res.ok) throw new Error('Não foi possível salvar a inscrição.')
      setState('on')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível ativar.')
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch(endpoint, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setState('off')
    } finally {
      setBusy(false)
    }
  }

  if (state === 'loading') return null
  if (state === 'unsupported') {
    return (
      <p className={`text-sm text-ink-muted ${className}`}>
        Para receber notificações, instale o app: no iPhone, toque em Compartilhar → &quot;Adicionar à Tela de
        Início&quot;; no Android, menu → &quot;Instalar app&quot;.
      </p>
    )
  }
  if (state === 'denied') {
    return (
      <p className={`text-sm text-returned-fg ${className}`}>
        As notificações estão bloqueadas. Libere nas configurações do navegador/aparelho.
      </p>
    )
  }
  return (
    <div className={className}>
      <button
        type="button"
        disabled={busy}
        onClick={state === 'on' ? disable : enable}
        className={`tf-btn ${state === 'on' ? 'tf-btn--secondary' : 'tf-btn--primary'}`}
      >
        {state === 'on' ? <BellOff className="tf-icon" /> : <Bell className="tf-icon" />}
        {state === 'on' ? 'Desligar notificações' : 'Ativar notificações'}
      </button>
      {error && <p className="text-sm text-returned-fg mt-2">{error}</p>}
    </div>
  )
}
