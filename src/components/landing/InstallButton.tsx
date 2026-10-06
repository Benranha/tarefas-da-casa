'use client'
import { useEffect, useState, type ReactNode } from 'react'

type InstallEvent = Event & { prompt: () => Promise<void> }

/** Link para #instalar. Onde o navegador oferece instalação direta (Android/Chrome/desktop), abre o prompt. */
export default function InstallButton({ className, children }: { className?: string; children: ReactNode }) {
  const [evt, setEvt] = useState<InstallEvent | null>(null)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setEvt(e as InstallEvent)
    }
    const onInstalled = () => setEvt(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  return (
    <a
      href="#instalar"
      className={`${className ?? ''} [@media(display-mode:standalone)]:hidden`}
      onClick={(e) => {
        if (!evt) return
        e.preventDefault()
        evt.prompt().finally(() => setEvt(null))
      }}
    >
      {children}
    </a>
  )
}
