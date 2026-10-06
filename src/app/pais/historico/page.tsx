'use client'
import React, { useEffect, useState } from 'react'
import { TrendingUp, Trophy, History, CheckCircle2, Undo2 } from 'lucide-react'
import TfIcon from '@/components/TfIcon'

type Child = { id: string; name: string; avatar: string; color: string; points: number; week_points: number }
type Event = {
  id: string
  status: 'approved' | 'pending'
  parent_note: string | null
  day: string
  title: string
  icon: string
  points: number
  child_name: string
  child_color: string
}

const TZ = 'America/Manaus'

// 'YYYY-MM-DD' de uma data no fuso da casa.
const dayKey = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: TZ })

function dayLabel(day: string) {
  const now = new Date()
  if (day === dayKey(now)) return 'Hoje'
  if (day === dayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000))) return 'Ontem'
  const [y, m, d] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  })
}

export default function HistoryPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    fetch('/api/pais/history', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setChildren(data.children)
        setEvents(data.events)
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false))
  }, [])

  const total = children.reduce((sum, c) => sum + c.points, 0)

  if (loading) return <div className="p-10 text-center text-ink-muted">Carregando histórico...</div>
  if (failed) return <div className="p-10 text-center text-returned-fg">Não foi possível carregar o histórico.</div>

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ink">Histórico de Conquistas</h1>
        <div className="bg-surface-raised px-4 py-2 rounded-full border-2 border-line flex items-center gap-2 font-bold text-ink">
          <Trophy size={20} className="text-waiting-fg" />
          Total: {total.toLocaleString('pt-BR')} pts
        </div>
      </div>

      {children.length === 0 ? (
        <p className="text-center text-ink-muted">Cadastre uma criança para acompanhar os pontos.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {children.map((c) => (
            <div key={c.id} className="bg-surface-raised p-6 rounded-[32px] border-2 border-line text-center shadow-sm">
              <div
                className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-sm font-bold mb-4 text-white"
                style={{ background: c.color }}
              >
                <TfIcon name={c.avatar} size={20} flat color="#fff" />
                {c.name}
              </div>
              <div className="text-4xl font-black text-ink mb-2">{c.points} pts</div>
              <div className="flex items-center justify-center gap-1 text-approved-fg font-bold text-sm">
                <TrendingUp size={16} />+{c.week_points} pts nos últimos 7 dias
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-surface-raised rounded-[32px] border-2 border-line overflow-hidden shadow-sm">
        <div className="p-6 border-b-2 border-line flex items-center gap-2 font-bold text-ink text-xl">
          <History size={24} />
          Linha do Tempo de Tarefas
        </div>
        {events.length === 0 ? (
          <p className="p-8 text-center text-ink-muted">
            Nada por aqui ainda. As tarefas aprovadas aparecem neste histórico.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {events.map((e) => {
              const approved = e.status === 'approved'
              return (
                <div key={e.id} className="p-4 flex items-center justify-between gap-3 hover:bg-surface-sunken transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-sm font-medium text-ink-muted w-16 shrink-0">{dayLabel(e.day)}</span>
                    {approved ? (
                      <CheckCircle2 size={26} className="text-approved-solid shrink-0" aria-label="Aprovada" />
                    ) : (
                      <Undo2 size={26} className="text-returned-border shrink-0" aria-label="Devolvida" />
                    )}
                    <div className="min-w-0">
                      <span className="font-bold text-ink-muted">
                        <TfIcon name={e.icon} size={20} className="mr-1" /> {e.title}
                      </span>
                      <span className="text-sm text-ink-muted"> • {e.child_name}</span>
                      {!approved && e.parent_note && (
                        <p className="text-xs text-ink-muted truncate">Devolvida: {e.parent_note}</p>
                      )}
                    </div>
                  </div>
                  <span className={`font-bold shrink-0 ${approved ? 'text-approved-fg' : 'text-ink-muted'}`}>
                    {approved ? `+${e.points} pts` : 'devolvida'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
