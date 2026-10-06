'use client'
import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Check, X } from 'lucide-react'

type Reward = { id: string; title: string; icon: string; cost_points: number }
type Redemption = {
  id: string
  title: string
  icon: string
  cost_points: number
  status: 'requested' | 'delivered' | 'denied'
  child_name: string
  child_avatar: string
}

const ICONS = ['🎁', '🍦', '🎮', '🎬', '🍕', '🧸', '🚲', '📖']

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState(ICONS[0])
  const [cost, setCost] = useState(50)
  const [saving, setSaving] = useState(false)

  async function load() {
    const [r, p] = await Promise.all([
      fetch('/api/pais/rewards', { cache: 'no-store' }),
      fetch('/api/pais/redemptions', { cache: 'no-store' }),
    ])
    if (r.ok) setRewards(await r.json())
    if (p.ok) setRedemptions(await p.json())
  }
  useEffect(() => {
    load()
    const timer = setInterval(load, 10000)
    return () => clearInterval(timer)
  }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/pais/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, icon, cost }),
    })
    setSaving(false)
    if (res.ok) {
      setTitle('')
      await load()
    } else {
      alert('Não foi possível cadastrar o prêmio.')
    }
  }

  async function remove(r: Reward) {
    if (!confirm(`Remover o prêmio "${r.title}"? Pedidos já feitos continuam valendo.`)) return
    const res = await fetch(`/api/pais/rewards/${r.id}`, { method: 'DELETE' })
    if (res.ok) await load()
  }

  async function resolve(id: string, action: 'deliver' | 'deny') {
    const res = await fetch(`/api/pais/redemptions/${id}/${action}`, { method: 'POST' })
    if (!res.ok) alert('Não foi possível atualizar o pedido.')
    await load()
  }

  const pending = redemptions.filter((x) => x.status === 'requested')
  const done = redemptions.filter((x) => x.status !== 'requested')

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-[#5C4033]">Recompensas</h1>

      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#5C4033]">Pedidos aguardando ({pending.length})</h2>
          {pending.map((p) => (
            <div key={p.id} className="bg-white p-4 rounded-[24px] border-2 border-yellow-200 flex items-center gap-3">
              <span className="text-3xl">{p.icon || '🎁'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800">{p.title}</p>
                <p className="text-sm text-gray-500">
                  {p.child_avatar} {p.child_name} • {p.cost_points} pts reservados
                </p>
              </div>
              <button
                onClick={() => resolve(p.id, 'deliver')}
                className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-2xl font-bold hover:bg-green-600"
              >
                <Check size={18} /> Entregue
              </button>
              <button
                onClick={() => resolve(p.id, 'deny')}
                className="flex items-center gap-1 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-bold hover:bg-red-100"
              >
                <X size={18} /> Recusar
              </button>
            </div>
          ))}
        </section>
      )}

      <form onSubmit={add} className="bg-white p-6 rounded-[24px] border-2 border-[#EEDCDF] space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={80}
          placeholder="Ex.: Sorvete no fim de semana"
          className="w-full p-3 rounded-2xl border-2 border-gray-200 focus:border-[#5C4033] outline-none"
        />
        <div className="flex flex-wrap gap-2">
          {ICONS.map((i) => (
            <button
              type="button"
              key={i}
              onClick={() => setIcon(i)}
              className={`text-2xl p-2 rounded-2xl border-2 ${icon === i ? 'border-[#5C4033] bg-gray-50' : 'border-transparent'}`}
            >
              {i}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={100000}
            value={cost}
            onChange={(e) => setCost(Number(e.target.value))}
            className="w-32 p-3 rounded-2xl border-2 border-gray-200"
            aria-label="Custo em pontos"
          />
          <span className="text-gray-500">pontos</span>
        </div>
        <button
          disabled={saving}
          className="flex items-center gap-2 bg-[#5C4033] text-white px-5 py-3 rounded-2xl font-bold hover:bg-[#4A3329] disabled:opacity-60"
        >
          <Plus size={20} />
          Adicionar prêmio
        </button>
      </form>

      {rewards.length > 0 && (
        <div className="bg-white rounded-[24px] border-2 border-[#EEDCDF] divide-y divide-gray-100 shadow-sm">
          {rewards.map((r) => (
            <div key={r.id} className="p-4 flex items-center gap-3">
              <span className="text-2xl">{r.icon || '🎁'}</span>
              <span className="flex-1 font-medium text-gray-800">{r.title}</span>
              <span className="font-bold text-[#5C4033]">{r.cost_points} pts</span>
              <button onClick={() => remove(r)} aria-label={`Remover ${r.title}`} className="p-2 text-gray-400 hover:text-red-500">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {done.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl font-bold text-[#5C4033]">Últimos pedidos</h2>
          <div className="bg-white rounded-[24px] border-2 border-[#EEDCDF] divide-y divide-gray-100">
            {done.map((p) => (
              <div key={p.id} className="p-4 flex items-center gap-3 text-sm">
                <span className="text-xl">{p.icon || '🎁'}</span>
                <span className="flex-1">
                  {p.title} • {p.child_avatar} {p.child_name}
                </span>
                <span className={p.status === 'delivered' ? 'text-green-600 font-bold' : 'text-gray-400'}>
                  {p.status === 'delivered' ? 'Entregue' : 'Recusado (pontos devolvidos)'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
