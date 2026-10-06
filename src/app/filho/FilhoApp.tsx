'use client'

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import confetti from 'canvas-confetti'
import { AlarmClock, ArrowLeft, Check, Circle, Clock, Gift, Moon, Star, Undo2 } from 'lucide-react'
import PinForm from '@/components/PinForm'
import PushToggle from '@/components/PushToggle'

type Info = { name: string; avatar: string; color: string; has_pin: boolean }
type Instance = {
  id: string
  status: 'pending' | 'awaiting_approval' | 'approved'
  parent_note: string | null
  tasks: { title: string; icon: string | null; points: number; description: string | null; due_time: string | null }
}
type Me = { id: string; name: string; avatar: string; color: string; points: number; wake_time: string; bed_time: string }
type Reward = { id: string; title: string; icon: string | null; cost_points: number }

const tokenKey = (code: string) => `filhoToken:${code}`

function readToken(code: string) {
  try {
    return localStorage.getItem(tokenKey(code))
  } catch {
    return null
  }
}

function Screen({ children }: { children: React.ReactNode }) {
  return <div className="tf-totem min-h-screen flex flex-col items-center p-5">{children}</div>
}

function Filho() {
  const code = useSearchParams().get('c') ?? ''
  const valid = /^[0-9a-f]{32}$/i.test(code)
  const [info, setInfo] = useState<Info | null>(null)
  const [state, setState] = useState<'loading' | 'invalid' | 'pin' | 'tasks'>('loading')
  const [token, setToken] = useState<string | null>(null)
  const [me, setMe] = useState<Me | null>(null)
  const [tasks, setTasks] = useState<Instance[]>([])
  const [view, setView] = useState<'tasks' | 'rewards'>('tasks')
  const [rewards, setRewards] = useState<Reward[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const prevStatus = useRef<Map<string, string>>(new Map())

  const headers = useCallback((t: string): Record<string, string> => ({ 'x-child-token': t }), [])

  const load = useCallback(
    async (t: string) => {
      const res = await fetch('/api/filho/tasks', { cache: 'no-store', headers: headers(t) })
      if (res.status === 401) {
        try {
          localStorage.removeItem(tokenKey(code))
        } catch {}
        setToken(null)
        setState('pin')
        return
      }
      if (!res.ok) return
      const data: { child: Me; tasks: Instance[] } = await res.json()
      for (const i of data.tasks) {
        if (prevStatus.current.get(i.id) === 'awaiting_approval' && i.status === 'approved') {
          confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 }, disableForReducedMotion: true })
        }
      }
      prevStatus.current = new Map(data.tasks.map((i) => [i.id, i.status]))
      setMe(data.child)
      setTasks(data.tasks)
      setState('tasks')
    },
    [code, headers],
  )

  useEffect(() => {
    if (!valid) return setState('invalid')
    fetch(`/api/filho/info?c=${code}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((i: Info) => {
        setInfo(i)
        const saved = readToken(code)
        if (saved) {
          setToken(saved)
          load(saved)
        } else setState('pin')
      })
      .catch(() => setState('invalid'))
  }, [code, valid, load])

  // Sem Realtime no Neon: atualiza a cada 8s enquanto a tela está aberta.
  useEffect(() => {
    if (!token || state !== 'tasks') return
    const timer = setInterval(() => load(token), 8000)
    return () => clearInterval(timer)
  }, [token, state, load])

  async function submitPin(pin: string): Promise<string | null> {
    const res = await fetch('/api/filho/entrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ c: code, pin }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      if (res.status === 409) setInfo((i) => (i ? { ...i, has_pin: true } : i))
      return data.error || 'Não deu certo. Tente de novo.'
    }
    try {
      localStorage.setItem(tokenKey(code), data.token)
    } catch {}
    setToken(data.token)
    await load(data.token)
    return null
  }

  async function markDone(id: string) {
    if (!token) return
    const res = await fetch(`/api/filho/tasks/${id}/done`, { method: 'POST', headers: headers(token) })
    if (res.ok || res.status === 409) await load(token)
  }

  async function openRewards() {
    if (!token) return
    setMessage(null)
    const res = await fetch('/api/filho/rewards', { cache: 'no-store', headers: headers(token) })
    setRewards(res.ok ? await res.json() : [])
    setView('rewards')
  }

  async function redeem(r: Reward) {
    if (!token) return
    const res = await fetch(`/api/filho/rewards/${r.id}/redeem`, { method: 'POST', headers: headers(token) })
    if (res.ok) {
      const data = await res.json()
      setMe((m) => (m ? { ...m, points: data.points } : m))
      setMessage(`Pedido enviado: ${r.title}! Avise os papais 🎉`)
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, disableForReducedMotion: true })
    } else setMessage('Você ainda não tem pontos suficientes.')
  }

  if (state === 'loading') return <Screen><div className="mt-32 animate-spin rounded-full h-12 w-12 border-b-4 border-brand" /></Screen>

  if (state === 'invalid' || !info) {
    return (
      <Screen>
        <p className="mt-32 text-xl text-center text-ink max-w-sm">
          Este link não funciona (ou foi desativado). Peça aos pais para mandar o link da sua tela de novo.
        </p>
      </Screen>
    )
  }

  const kid = { '--kid': info.color, '--kid-soft': `color-mix(in srgb, ${info.color} 14%, var(--surface-raised))` } as React.CSSProperties

  if (state === 'pin') {
    return (
      <div className="tf-totem min-h-screen flex flex-col items-center justify-center gap-6 p-6" style={kid}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/tarefinha-horizontal-claro.svg" alt="Tarefinha" className="h-10" />
        <span className="tf-child__avatar" style={{ ['--size' as string]: '110px' }}>{info.avatar}</span>
        <h1 className="font-display text-3xl font-semibold text-ink text-center">Oi, {info.name}!</h1>
        <PinForm key={String(info.has_pin)} creating={!info.has_pin} onSubmit={submitPin} />
      </div>
    )
  }

  const approved = tasks.filter((t) => t.status === 'approved').length

  return (
    <div className="tf-totem min-h-screen flex flex-col" style={kid}>
      <header className="flex items-center justify-between gap-3 px-5 py-4" style={{ background: 'var(--kid-soft)' }}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="tf-child__avatar" style={{ ['--size' as string]: '56px', borderWidth: 4, boxShadow: 'none', background: 'var(--surface-raised)' }}>
            {info.avatar}
          </span>
          <div className="min-w-0">
            <p className="font-display text-2xl font-semibold text-ink truncate">Oi, {info.name}!</p>
            {me && (
              <p className="text-sm font-bold text-ink-muted flex items-center gap-1">
                <Moon className="tf-icon" /> Dormir às {me.bed_time}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="tf-seal" style={{ width: 56, height: 56, fontSize: 18 }}><Star size={26} className="fill-current" /></div>
          <div className="leading-none">
            <div className="font-display text-3xl font-bold text-ink">{me?.points ?? 0}</div>
            <div className="text-xs font-bold text-ink-muted">pontos</div>
          </div>
        </div>
      </header>

      {view === 'rewards' ? (
        <main className="flex-1 p-5 space-y-4">
          <button onClick={() => setView('tasks')} className="tf-btn tf-btn--secondary"><ArrowLeft className="tf-icon" /> Voltar</button>
          <h2 className="font-display text-3xl font-semibold text-ink">Recompensas</h2>
          {message && <p className="text-lg font-bold text-ink">{message}</p>}
          {rewards.length === 0 && <p className="text-ink-muted">Os papais ainda não cadastraram recompensas.</p>}
          <div className="grid gap-4">
            {rewards.map((r) => {
              const can = (me?.points ?? 0) >= r.cost_points
              return (
                <button key={r.id} type="button" disabled={!can} onClick={() => redeem(r)}
                  className={`tf-task ${can ? 'tf-task--waiting' : ''} disabled:opacity-60`}>
                  <span className="tf-task__row">
                    <span className="tf-task__icon">{r.icon || '🎁'}</span>
                    <span className="tf-task__pts">{r.cost_points} ⭐</span>
                  </span>
                  <span>
                    <p className="tf-task__title">{r.title}</p>
                    <span className="tf-task__status">{can ? 'Toque para pedir' : `Faltam ${r.cost_points - (me?.points ?? 0)} pts`}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </main>
      ) : (
        <main className="flex-1 p-5 space-y-4">
          {tasks.length === 0 && <p className="text-center font-display text-2xl text-ink-muted py-12">Tudo limpo por aqui! 🎉</p>}
          <div className="grid gap-4">
            {tasks.map((i) => {
              const st = i.status
              const returned = st === 'pending' && Boolean(i.parent_note)
              return (
                <button
                  key={i.id}
                  type="button"
                  className={`tf-task ${st === 'approved' ? 'tf-task--approved' : st === 'awaiting_approval' ? 'tf-task--waiting' : returned ? 'tf-task--returned' : ''}`}
                  onClick={() => st === 'pending' && markDone(i.id)}
                >
                  <span className="tf-task__icon">{i.tasks.icon || '✨'}</span>
                  <span className="flex-1 min-w-0">
                    <p className="tf-task__title">{i.tasks.title}</p>
                    {i.tasks.due_time && (
                      <span className="tf-task__status"><AlarmClock className="tf-icon" /> Às {i.tasks.due_time}</span>
                    )}
                    {i.tasks.description && <p className="text-sm text-ink-muted">{i.tasks.description}</p>}
                    <span className="tf-task__status">
                      {st === 'approved' && (<><Check className="tf-icon" /> Aprovado!</>)}
                      {st === 'awaiting_approval' && (<><Clock className="tf-icon" /> Aguardando papais...</>)}
                      {st === 'pending' && !returned && (<><Circle className="tf-icon" /> Toque quando terminar</>)}
                      {returned && (<><Undo2 className="tf-icon" /> Devolvida. Toque quando refizer</>)}
                    </span>
                    {returned && <span className="tf-task__note !text-base">💬 Papais: {i.parent_note}</span>}
                  </span>
                  <span className="tf-task__pts">+{i.tasks.points} ⭐</span>
                </button>
              )
            })}
          </div>
          <p className="text-center font-bold text-ink-muted">{approved} de {tasks.length} aprovadas</p>
          <div className="flex justify-center">
            <button onClick={openRewards} className="tf-btn tf-btn--primary"><Gift className="tf-icon" /> Prêmios</button>
          </div>
          {token && <PushToggle endpoint="/api/filho/push" headers={headers(token)} className="text-center" />}
        </main>
      )}
    </div>
  )
}

export default function FilhoApp() {
  return (
    <Suspense fallback={null}>
      <Filho />
    </Suspense>
  )
}
