'use client'
import React, { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AlarmClock, ArrowLeft, Check, CheckCheck, ChevronDown, Moon, Undo2 } from 'lucide-react'
import TfIcon from '@/components/TfIcon'

type Status = 'pending' | 'awaiting_approval' | 'approved'
type Instance = {
  id: string
  status: Status
  completed_at: string | null
  parent_note: string | null
  tasks: { title: string; icon: string | null; points: number; description: string | null; due_time: string | null }
}
type Child = { id: string; name: string; avatar: string; color: string; points: number; wake_time: string; bed_time: string }

const STATUS_LABEL: Record<Status, string> = {
  pending: 'A fazer',
  awaiting_approval: 'Feita, aguardando aprovação',
  approved: 'Feita e aprovada',
}

export default function ChildTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [child, setChild] = useState<Child | null>(null)
  const [tasks, setTasks] = useState<Instance[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const load = useCallback(async () => {
    const res = await fetch(`/api/pais/children/${id}/tasks`, { cache: 'no-store' })
    if (!res.ok) {
      setFailed(true)
      setLoading(false)
      return
    }
    const data = await res.json()
    setChild(data.child)
    setTasks(data.tasks)
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
    // Sem Realtime no Neon: atualiza a cada 10s.
    const timer = setInterval(load, 10000)
    return () => clearInterval(timer)
  }, [load])

  async function act(instanceId: string, action: 'done' | 'approve' | 'reject') {
    setBusy(true)
    const res = await fetch(`/api/pais/instances/${instanceId}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: action === 'reject' ? JSON.stringify({ note }) : undefined,
    })
    setBusy(false)
    if (!res.ok) alert('Não foi possível atualizar a tarefa. Atualize a tela e tente de novo.')
    setRejecting(null)
    setNote('')
    await load()
  }

  if (loading) return <div className="p-10 text-center text-ink-muted">Carregando tarefas...</div>
  if (failed || !child) return <div className="p-10 text-center text-returned-fg">Criança não encontrada.</div>

  const approved = tasks.filter((t) => t.status === 'approved').length
  const kid = { '--kid': child.color, '--kid-soft': `color-mix(in srgb, ${child.color} 14%, var(--surface-raised))` } as React.CSSProperties

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/pais/criancas" className="inline-flex items-center gap-1 text-sm font-bold text-ink-muted">
        <ArrowLeft size={16} /> Crianças
      </Link>

      <header className="flex items-center gap-4" style={kid}>
        <span className="tf-child__avatar" style={{ ['--size' as string]: '72px', borderWidth: 4, boxShadow: 'none' }}><TfIcon name={child.avatar} size={47} color={child.color} /></span>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-3xl font-semibold text-ink">{child.name}</h1>
          <p className="text-sm text-ink-muted flex items-center gap-3 flex-wrap">
            <span>{child.points} pontos</span>
            <span className="flex items-center gap-1"><Moon size={14} /> {child.wake_time} – {child.bed_time}</span>
            <span>{approved} de {tasks.length} aprovadas hoje</span>
          </p>
        </div>
      </header>

      {tasks.length === 0 ? (
        <p className="bg-surface-raised p-8 rounded-[24px] border-2 border-dashed border-line text-center text-ink-muted">
          Nenhuma tarefa para hoje. Cadastre em &quot;Tarefas&quot;.
        </p>
      ) : (
        <ul className="grid gap-3">
          {tasks.map((t) => {
            const isOpen = open === t.id
            const returned = t.status === 'pending' && Boolean(t.parent_note)
            const cls =
              t.status === 'approved' ? 'tf-task--approved' : t.status === 'awaiting_approval' ? 'tf-task--waiting' : returned ? 'tf-task--returned' : ''
            return (
              <li key={t.id}>
                <div className={`tf-task !flex-col !items-stretch ${cls}`}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : t.id)}
                    aria-expanded={isOpen}
                    className="flex items-center gap-4 text-left w-full"
                  >
                    <span className="tf-task__icon"><TfIcon name={t.tasks.icon} size={40} /></span>
                    <span className="flex-1 min-w-0">
                      <span className="tf-task__title block">{t.tasks.title}</span>
                      <span className="tf-task__status">{STATUS_LABEL[t.status]}</span>
                    </span>
                    <ChevronDown size={22} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="space-y-4 pt-2 border-t-2 border-line">
                      <dl className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <dt className="text-ink-muted">Pontos</dt>
                          <dd className="font-bold text-ink">{t.tasks.points}<TfIcon name="estrela" size={20} className="ml-1" /></dd>
                        </div>
                        <div>
                          <dt className="text-ink-muted">Horário</dt>
                          <dd className="font-bold text-ink flex items-center gap-1">
                            <AlarmClock size={14} /> {t.tasks.due_time ?? 'Sem horário'}
                          </dd>
                        </div>
                        {t.completed_at && (
                          <div>
                            <dt className="text-ink-muted">Marcada como feita</dt>
                            <dd className="font-bold text-ink">
                              {new Date(t.completed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Manaus' })}
                            </dd>
                          </div>
                        )}
                      </dl>
                      {t.tasks.description && <p className="text-ink">{t.tasks.description}</p>}
                      {returned && <p className="text-sm text-returned-fg font-bold">Devolvida: {t.parent_note}</p>}

                      {rejecting === t.id && (
                        <input
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          maxLength={140}
                          autoFocus
                          placeholder="Recado para devolver (opcional)"
                          className="w-full min-h-12 px-5 rounded-full border-2 border-line-strong"
                        />
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {t.status === 'pending' && (
                          <>
                            <button disabled={busy} onClick={() => act(t.id, 'done')} className="tf-btn tf-btn--secondary">
                              <Check className="tf-icon" /> Marcar como feita
                            </button>
                            <button disabled={busy} onClick={() => act(t.id, 'approve')} className="tf-btn tf-btn--approve">
                              <CheckCheck className="tf-icon" /> Feita e aprovada
                            </button>
                          </>
                        )}
                        {t.status === 'awaiting_approval' &&
                          (rejecting === t.id ? (
                            <>
                              <button onClick={() => { setRejecting(null); setNote('') }} className="tf-btn tf-btn--secondary">Cancelar</button>
                              <button disabled={busy} onClick={() => act(t.id, 'reject')} className="tf-btn tf-btn--return"><Undo2 className="tf-icon" /> Devolver</button>
                            </>
                          ) : (
                            <>
                              <button disabled={busy} onClick={() => act(t.id, 'approve')} className="tf-btn tf-btn--approve"><Check className="tf-icon" /> Aprovar</button>
                              <button onClick={() => { setRejecting(t.id); setNote('') }} className="tf-btn tf-btn--return"><Undo2 className="tf-icon" /> Devolver</button>
                            </>
                          ))}
                        {t.status === 'approved' && (
                          <p className="sm:col-span-2 font-bold text-approved-fg flex items-center gap-2"><CheckCheck className="tf-icon" /> Aprovada, pontos já somados.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
