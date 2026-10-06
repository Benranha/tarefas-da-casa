'use client'
import React, { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

const AVATARS = ['👦', '👧', '🧒', '👶', '🧑', '🐱', '🐶', '🦄']
const COLORS = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444']

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
      <h1 className="text-3xl font-bold text-[#5C4033]">Crianças</h1>

      <form onSubmit={add} className="bg-white p-6 rounded-[24px] border-2 border-[#EEDCDF] space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={40}
          placeholder="Nome da criança"
          className="w-full p-3 rounded-2xl border-2 border-gray-200 focus:border-[#5C4033] outline-none"
        />
        <div className="flex flex-wrap gap-2">
          {AVATARS.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => setAvatar(a)}
              className={`text-3xl p-2 rounded-2xl border-2 ${avatar === a ? 'border-[#5C4033] bg-gray-50' : 'border-transparent'}`}
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
              className={`w-9 h-9 rounded-full border-4 ${color === c ? 'border-[#5C4033]' : 'border-white'} shadow`}
              style={{ background: c }}
            />
          ))}
        </div>
        <button
          disabled={saving}
          className="flex items-center gap-2 bg-[#5C4033] text-white px-5 py-3 rounded-2xl font-bold hover:bg-[#4A3329] disabled:opacity-60"
        >
          <Plus size={20} />
          Adicionar criança
        </button>
      </form>

      {children.length === 0 ? (
        <p className="text-center text-gray-500">Nenhuma criança cadastrada ainda.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {children.map((c) => (
            <div key={c.id} className="bg-white p-6 rounded-[24px] border-2 border-[#EEDCDF] flex items-center gap-4 shadow-sm">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl bg-white"
                style={{ boxShadow: `0 0 0 4px ${c.color}` }}
              >
                {c.avatar}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-[#5C4033]">{c.name}</h3>
                <p className="text-gray-500 text-sm">{c.points} pontos</p>
              </div>
              <button onClick={() => remove(c)} aria-label={`Remover ${c.name}`} className="p-2 text-gray-400 hover:text-red-500">
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
