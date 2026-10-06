'use client'
import React, { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

const AVATARS = ['👦', '👧', '🧒', '👶', '🧑', '🐱', '🐶', '🦄']
const COLORS = ['#2F5BEA', '#C8266B', '#3F7D20', '#9A5B06', '#7A3FE0', '#0B7A85', '#C8362B']

type Child = { id: string; name: string; avatar: string; color: string; points: number }

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [color, setColor] = useState(COLORS[0])
  const [saving, setSaving] = useState(false)

  async function load() {
    const res = await fetch('/api/pais/children', { cache: 'no-store' })
    if (res.ok) setChildren(await res.json())
  }
  useEffect(() => {
    load()
  }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/pais/children', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, avatar, color }),
    })
    setSaving(false)
    if (res.ok) {
      setName('')
      await load()
    } else {
      alert('Não foi possível cadastrar.')
    }
  }

  async function remove(c: Child) {
    if (!confirm(`Remover ${c.name}? As tarefas e os pontos dela também serão apagados.`)) return
    const res = await fetch(`/api/pais/children/${c.id}`, { method: 'DELETE' })
    if (res.ok) await load()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-ink">Crianças</h1>

      <form onSubmit={add} className="bg-surface-raised p-6 rounded-[24px] border-2 border-line space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={40}
          placeholder="Nome da criança"
          className="w-full p-3 rounded-2xl border-2 border-line focus:border-brand outline-none"
        />
        <div className="flex flex-wrap gap-2">
          {AVATARS.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => setAvatar(a)}
              className={`text-3xl p-2 rounded-2xl border-2 ${avatar === a ? 'border-brand bg-surface-sunken' : 'border-transparent'}`}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c}
              aria-label={`Cor ${c}`}
              onClick={() => setColor(c)}
              className={`w-9 h-9 rounded-full border-4 ${color === c ? 'border-brand' : 'border-surface-raised'} shadow`}
              style={{ background: c }}
            />
          ))}
        </div>
        <button
          disabled={saving}
          className="tf-btn tf-btn--primary"
        >
          <Plus size={20} />
          Adicionar criança
        </button>
      </form>

      {children.length === 0 ? (
        <p className="text-center text-ink-muted">Nenhuma criança cadastrada ainda.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {children.map((c) => (
            <div key={c.id} className="bg-surface-raised p-6 rounded-[24px] border-2 border-line flex items-center gap-4 shadow-sm">
              <div
                className="tf-child"
                style={{ '--kid': c.color, '--kid-soft': `color-mix(in srgb, ${c.color} 14%, var(--surface-raised))` } as React.CSSProperties}
              >
                <span className="tf-child__avatar" style={{ ['--size' as string]: '64px', borderWidth: 4, boxShadow: 'none' }}>{c.avatar}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-ink">{c.name}</h3>
                <p className="text-ink-muted text-sm">{c.points} pontos</p>
              </div>
              <button onClick={() => remove(c)} aria-label={`Remover ${c.name}`} className="p-2 text-ink-muted hover:text-returned-fg">
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
