'use client'

import { useEffect, useRef } from 'react'

type Options = {
  // Liga/desliga o polling (ex.: só enquanto a criança está na tela de tarefas).
  enabled?: boolean
  // Para de buscar depois deste tempo sem ninguém tocar/digitar/mexer o mouse.
  // Volta a buscar (na hora) no primeiro toque.
  idleAfterMs?: number
}

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'] as const

// Sem Realtime no Neon, as telas atualizam por polling. Cada busca é uma função na Vercel
// e uma consulta no banco, então só buscamos quando alguém pode estar vendo:
// - aba visível (tela apagada ou app em segundo plano não busca);
// - houve interação recente (o totem fica com a tela sempre ligada, então isso evita
//   que um tablet esquecido busque a noite inteira).
// Ao voltar (aba visível de novo ou primeiro toque depois de parado), atualiza na hora.
// A primeira busca ao montar continua sendo responsabilidade da tela.
export function usePolling(fn: () => unknown, intervalMs: number, { enabled = true, idleAfterMs }: Options = {}) {
  const fnRef = useRef(fn)
  useEffect(() => {
    fnRef.current = fn
  })

  useEffect(() => {
    if (!enabled) return

    let lastActivity = Date.now()
    let lastRun = Date.now()
    let timer: ReturnType<typeof setTimeout> | null = null

    const visible = () => document.visibilityState === 'visible'
    const idle = () => idleAfterMs != null && Date.now() - lastActivity > idleAfterMs
    const active = () => visible() && !idle()

    const run = () => {
      lastRun = Date.now()
      try {
        const r = fnRef.current()
        if (r instanceof Promise) r.catch(() => {})
      } catch {}
    }

    const schedule = () => {
      if (timer) clearTimeout(timer)
      timer = null
      if (!active()) return
      timer = setTimeout(() => {
        timer = null
        if (!active()) return
        run()
        schedule()
      }, intervalMs)
    }

    // Retomando depois de parado: atualiza já se a última busca ficou para trás.
    const resume = () => {
      if (!active()) return
      if (Date.now() - lastRun >= Math.min(intervalMs, 5000)) run()
      schedule()
    }

    const onVisibility = () => {
      if (visible()) {
        lastActivity = Date.now()
        resume()
      } else if (timer) {
        clearTimeout(timer)
        timer = null
      }
    }

    const onActivity = () => {
      const wasIdle = idle()
      lastActivity = Date.now()
      if (wasIdle || !timer) resume()
    }

    document.addEventListener('visibilitychange', onVisibility)
    if (idleAfterMs != null) {
      for (const e of ACTIVITY_EVENTS) window.addEventListener(e, onActivity, { passive: true })
    }
    schedule()

    return () => {
      if (timer) clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      for (const e of ACTIVITY_EVENTS) window.removeEventListener(e, onActivity)
    }
  }, [enabled, intervalMs, idleAfterMs])
}

// Painel dos pais aberto numa aba esquecida: para de buscar depois de 10 min sem uso.
export const PAIS_IDLE_MS = 10 * 60_000
