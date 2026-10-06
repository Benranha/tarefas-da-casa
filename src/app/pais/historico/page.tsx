'use client'
import React, { useEffect, useState } from 'react'
import { TrendingUp, Trophy, History } from 'lucide-react'

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

  if (loading) return <div className="p-10 text-center text-gray-500">Carregando histórico...</div>
  if (failed) return <div className="p-10 text-center text-red-600">Não foi possível carregar o histórico.</div>

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#5C4033]">Histórico de Conquistas</h1>
        <div className="bg-white px-4 py-2 rounded-full border-2 border-[#EEDCDF] flex items-center gap-2 font-bold text-[#5C4033]">
          <Trophy size={20} className="text-yellow-500" />
          Total: {total.toLocaleString('pt-BR')} pts
        </div>
      </div>

      {children.length === 0 ? (
        <p className="text-center text-gray-500">Cadastre uma criança para acompanhar os pontos.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {children.map((c) => (
            <div key={c.id} className="bg-white p-6 rounded-[32px] border-2 border-[#EEDCDF] text-center shadow-sm">
              <div
                className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-sm font-bold mb-4 text-white"
                style={{ background: c.color }}
              >
                <span>{c.avatar}</span>
                {c.name}
              </div>
              <div className="text-4xl font-black text-[#5C4033] mb-2">{c.points} pts</div>
              <div className="flex items-center justify-center gap-1 text-green-600 font-bold text-sm">
                <TrendingUp size={16} />+{c.week_points} pts nos últimos 7 dias
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-[32px] border-2 border-[#EEDCDF] overflow-hidden shadow-sm">
        <div className="p-6 border-b-2 border-[#EEDCDF] flex items-center gap-2 font-bold text-[#5C4033] text-xl">
          <History size={24} />
          Linha do Tempo de Tarefas
        </div>
        {events.length === 0 ? (
          <p className="p-8 text-center text-gray-500">
            Nada por aqui ainda. As tarefas aprovadas aparecem neste histórico.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {events.map((e) => {
              const approved = e.status === 'approved'
              return (
                <div key={e.id} className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-sm font-medium text-gray-400 w-16 shrink-0">{dayLabel(e.day)}</span>
                    <span className="text-2xl">{approved ? '✅' : '↩️'}</span>
                    <div className="min-w-0">
                      <span className="font-bold text-gray-700">
                        {e.icon} {e.title}
                      </span>
                      <span className="text-sm text-gray-500"> • {e.child_name}</span>
                      {!approved && e.parent_note && (
                        <p className="text-xs text-gray-400 truncate">Devolvida: {e.parent_note}</p>
                      )}
                    </div>
                  </div>
                  <span className={`font-bold shrink-0 ${approved ? 'text-green-600' : 'text-gray-400'}`}>
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
