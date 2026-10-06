'use client'
import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Calendar } from 'lucide-react'

type Child = { id: string; name: string }
type Task = { id: string; title: string; icon: string; points: number; child_name: string }

const ICONS = ['🧹', '🛏️', '🍽️', '🪥', '📚', '🐾', '🧺', '🗑️']

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState(ICONS[0])
  const [points, setPoints] = useState(10)
  const [childId, setChildId] = useState('')
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
      body: JSON.stringify({ title, icon, points, childId }),
    })
    setSaving(false)
    if (res.ok) {
      setTitle('')
      await load()
    } else {
      alert('Não foi possível cadastrar a tarefa.')
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
          <div className="flex flex-wrap gap-2">
            {ICONS.map((i) => (
              <button
                type="button"
                key={i}
                onClick={() => setIcon(i)}
                className={`text-2xl p-2 rounded-2xl border-2 ${icon === i ? 'border-brand bg-surface-sunken' : 'border-transparent'}`}
              >
                {i}
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
          </div>
          <p className="text-sm text-ink-muted flex items-center gap-1">
            <Calendar size={14} /> A tarefa aparece todos os dias no totem.
          </p>
          <button
            disabled={saving}
            className="flex items-center gap-2 bg-brand text-on-brand px-5 py-3 rounded-2xl font-bold hover:bg-brand-hover disabled:opacity-60"
          >
            <Plus size={20} />
            Adicionar tarefa
          </button>
        </form>
      )}

      {tasks.length > 0 && (
        <div className="bg-surface-raised rounded-[24px] border-2 border-line divide-y divide-line shadow-sm">
          {tasks.map((t) => (
            <div key={t.id} className="p-4 flex items-center gap-3">
              <span className="text-2xl">{t.icon}</span>
              <span className="flex-1 font-medium text-ink">{t.title}</span>
              <span className="px-3 py-1 bg-brand-soft text-brand-ink rounded-full text-xs font-bold">{t.child_name}</span>
              <span className="font-bold text-ink">{t.points} pts</span>
              <button onClick={() => remove(t)} aria-label={`Remover ${t.title}`} className="p-2 text-ink-muted hover:text-returned-fg">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
