'use client'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { Download, X } from 'lucide-react'
import { track } from '@/lib/analytics'

type InstallEvent = Event & { prompt: () => Promise<void> }

const CLOSED_KEY = 'tarefinha-instalar-fechado'

// Aviso para instalar o app, só no painel (quem já entrou na conta). Some quando o app já está
// instalado (aberto como app) ou depois que o responsável fecha o aviso.
function readEnv(): 'off' | 'ios' | 'other' {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  let closed = false
  try { closed = localStorage.getItem(CLOSED_KEY) === '1' } catch {}
  if (standalone || closed) return 'off'
  const ios =
    /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return ios ? 'ios' : 'other'
}
const noSubscribe = () => () => {}

export default function InstalarAviso() {
  const env = useSyncExternalStore(noSubscribe, readEnv, () => 'off' as const)
  const [hidden, setHidden] = useState(false)
  const [evt, setEvt] = useState<InstallEvent | null>(null)
  const ios = env === 'ios'

  useEffect(() => {
    if (env === 'off') return
    // O navegador só oferece a instalação direta se houver service worker.
    navigator.serviceWorker?.register('/sw.js').catch(() => {})
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setEvt(e as InstallEvent)
    }
    const onInstalled = () => {
      track('app_install')
      setHidden(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [env])

  function close() {
    try { localStorage.setItem(CLOSED_KEY, '1') } catch {}
    setHidden(true)
  }

  if (env === 'off' || hidden) return null

  return (
    <div className="order-1 tf-card relative !bg-brand-soft !py-4 !pl-5 !pr-12 text-ink">
      <button type="button" onClick={close} aria-label="Fechar aviso" className="absolute right-2 top-2 p-2 rounded-full hover:bg-surface-sunken">
        <X size={18} />
      </button>
      <p className="font-extrabold text-[15px] leading-5">Instale o Tarefinha como aplicativo</p>
      <p className="mt-1 text-[14px] leading-5 text-ink-muted">
        Ele fica na tela inicial como um aplicativo, abre mais rápido e avisa quando seu filho terminar uma tarefa.
      </p>
      {evt ? (
        <button
          type="button"
          onClick={() => {
            track('app_install_prompt')
            evt.prompt().finally(() => setEvt(null))
          }}
          className="tf-btn tf-btn--primary !text-[15px] !px-[18px] mt-3"
        >
          <Download size={18} /> Instalar
        </button>
      ) : ios ? (
        <p className="mt-2 text-[14px] leading-5">
          No iPhone, abra no <strong>Safari</strong>, toque em <strong>Compartilhar</strong> (quadrado com a seta para cima) e depois em{' '}
          <strong>Adicionar à Tela de Início</strong>.
        </p>
      ) : (
        <p className="mt-2 text-[14px] leading-5">
          No Android, toque no menu do navegador (três pontinhos) e em <strong>Instalar app</strong>. No computador, use o ícone de instalar na barra de endereço.
        </p>
      )}
    </div>
  )
}
