'use client'
import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Calendar, AlarmClock, Pencil, Check, EllipsisVertical } from 'lucide-react'
import TfIcon from '@/components/TfIcon'
import { TF_GROUPS } from '@/lib/tf-icons-data'

type Child = { id: string; name: string; wake_time: string; bed_time: string }
type Task = {
  id: string
  title: string
  description: string | null
  icon: string
  points: number
  due_time: string | null
  child_name: string
  assigned_child_id: string
}

const ICONS = TF_GROUPS.tarefas

const window_for = (children: Child[], id: string) => children.find((c) => c.id === id)

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState<string>(ICONS[0])
  const [points, setPoints] = useState(10)
  const [childId, setChildId] = useState('')
  const [description, setDescription] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [editTime, setEditTime] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const [t, c] = await Promise.all([
      fetch('/api/pais/tasks', { cache: 'no-store' }),
      fetch('/api/pais/children', { cache: 'no-store' }),
    ])
    if (t.ok) setTasks(await t.json())
    if (c.ok) {
      const list: Child[] = await c.json()
      setChildren(list)
      setChildId((cur) => cur || list[0]?.id || '')
    }
  }
  useEffect(() => {
    load()
  }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/pais/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, icon, points, childId, description, dueTime }),
    })
    setSaving(false)
    if (res.ok) {
      setTitle('')
      setDescription('')
      setDueTime('')
      await load()
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.error || 'Não foi possível cadastrar a tarefa.')
    }
  }

  function startEdit(t: Task) {
    setEditing(t.id)
    setEditTime(t.due_time ?? '')
    setEditDescription(t.description ?? '')
  }

  async function saveEdit(t: Task) {
    const res = await fetch(`/api/pais/tasks/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dueTime: editTime, description: editDescription }),
    })
    if (res.ok) {
      setEditing(null)
      await load()
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.error || 'Não foi possível salvar.')
    }
  }

  async function remove(t: Task) {
    if (!confirm(`Remover a tarefa "${t.title}"?`)) return
    const res = await fetch(`/api/pais/tasks/${t.id}`, { method: 'DELETE' })
    if (res.ok) await load()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-ink">Tarefas</h1>

      {children.length === 0 ? (
        <p className="bg-waiting-bg border border-waiting-border text-waiting-fg p-4 rounded-2xl">
          Cadastre uma criança primeiro, em &quot;Crianças&quot;.
        </p>
      ) : (
        <form onSubmit={add} className="bg-surface-raised p-6 rounded-[24px] border-2 border-line space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={80}
            placeholder="Ex.: Arrumar o quarto"
            className="w-full p-3 rounded-2xl border-2 border-line focus:border-brand outline-none"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            placeholder="Detalhes (opcional): o que precisa ser feito"
            className="w-full p-3 rounded-2xl border-2 border-line focus:border-brand outline-none"
          />
          <div className="flex flex-wrap gap-2">
            {ICONS.map((i) => (
              <button
                type="button"
                key={i}
                onClick={() => setIcon(i)}
                className={`p-2 rounded-2xl border-2 ${icon === i ? 'border-brand bg-surface-sunken' : 'border-transparent'}`}
              >
                <TfIcon name={i} size={34} />
              </button>
            ))}
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <select
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
              className="flex-1 p-3 rounded-2xl border-2 border-line"
            >
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              max={1000}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="md:w-32 p-3 rounded-2xl border-2 border-line"
              aria-label="Pontos"
            />
            <label className="flex items-center gap-2 font-bold text-ink">
              <AlarmClock size={18} /> Horário
              <input
                type="time"
                value={dueTime}
                min={window_for(children, childId)?.wake_time}
                max={window_for(children, childId)?.bed_time}
                onChange={(e) => setDueTime(e.target.value)}
                className="min-h-11 px-3 rounded-2xl border-2 border-line"
              />
            </label>
          </div>
          {window_for(children, childId) && (
            <p className="text-sm text-ink-muted">
              {window_for(children, childId)!.name} acorda às {window_for(children, childId)!.wake_time} e dorme às{' '}
              {window_for(children, childId)!.bed_time}. O horário da tarefa fica entre os dois (opcional).
            </p>
          )}
          <p className="text-sm text-ink-muted flex items-center gap-1">
            <Calendar size={14} /> A tarefa aparece todos os dias, no totem e no aparelho da criança.
          </p>
          <button
            disabled={saving}
            className="tf-btn tf-btn--primary"
          >
            <Plus size={20} />
            Adicionar tarefa
          </button>
        </form>
      )}

      {tasks.length > 0 && (
        <div className="bg-surface-raised rounded-[24px] border-2 border-line divide-y divide-line shadow-sm">
          {tasks.map((t) => (
            <div key={t.id} className="p-4 space-y-3">
              <div className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 md:flex md:items-center">
                <span className="mt-0.5 md:mt-0 shrink-0"><TfIcon name={t.icon} size={28} /></span>
                <span className="min-w-0 md:flex-1">
                  <span className="font-medium text-ink block text-pretty">{t.title}</span>
                  {t.description && <span className="text-sm text-ink-muted block">{t.description}</span>}
                </span>
                <span className="col-start-2 col-span-2 row-start-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 md:contents">
                  {t.due_time && (
                    <span className="flex items-center gap-1 text-sm font-bold text-ink-muted"><AlarmClock size={14} /> {t.due_time}</span>
                  )}
                  <span className="px-3 py-1 bg-brand-soft text-brand-ink rounded-full text-xs font-bold whitespace-nowrap">{t.child_name}</span>
                  <span className="font-bold text-ink whitespace-nowrap">{t.points} pts</span>
                </span>
                <span className="relative col-start-3 row-start-1 shrink-0 -my-1 -mr-2 md:m-0">
                  <button
                    onClick={() => setMenuFor(menuFor === t.id ? null : t.id)}
                    aria-label={`Ações de ${t.title}`}
                    aria-haspopup="menu"
                    aria-expanded={menuFor === t.id}
                    className="size-11 grid place-items-center rounded-full text-ink-muted hover:text-brand"
                  >
                    <EllipsisVertical size={22} />
                  </button>
                  {menuFor === t.id && (
                    <>
                      <button type="button" aria-label="Fechar menu" tabIndex={-1} onClick={() => setMenuFor(null)} className="fixed inset-0 z-30 cursor-default" />
                      <div role="menu" className="absolute right-2 top-11 z-40 min-w-40 p-1.5 rounded-2xl border-2 border-line bg-surface-raised shadow-pop">
                        <button
                          role="menuitem"
                          onClick={() => { setMenuFor(null); if (editing === t.id) setEditing(null); else startEdit(t) }}
                          className="w-full min-h-11 px-3 flex items-center gap-3 rounded-xl font-extrabold text-ink hover:bg-surface-sunken"
                        >
                          <Pencil size={18} /> Editar
                        </button>
                        <button
                          role="menuitem"
                          onClick={() => { setMenuFor(null); remove(t) }}
                          className="w-full min-h-11 px-3 flex items-center gap-3 rounded-xl font-extrabold text-returned-fg hover:bg-returned-bg"
                        >
                          <Trash2 size={18} /> Remover
                        </button>
                      </div>
                    </>
                  )}
                </span>
              </div>
              {editing === t.id && (
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    aria-label="Horário"
                    className="min-h-11 px-3 rounded-2xl border-2 border-line"
                  />
                  <input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    maxLength={500}
                    placeholder="Detalhes"
                    className="flex-1 p-3 rounded-2xl border-2 border-line"
                  />
                  <button onClick={() => saveEdit(t)} className="tf-btn tf-btn--primary !min-h-11"><Check className="tf-icon" /> Salvar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
