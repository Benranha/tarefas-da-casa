'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Copy, KeyRound, ListChecks, Moon, Plus, Smartphone, Sun, Trash2 } from 'lucide-react'

const AVATARS = ['👦', '👧', '🧒', '👶', '🧑', '🐱', '🐶', '🦄']
const COLORS = ['#2F5BEA', '#C8266B', '#3F7D20', '#9A5B06', '#7A3FE0', '#0B7A85', '#C8362B']

type Child = {
  id: string
  name: string
  avatar: string
  color: string
  points: number
  has_device: boolean
  has_pin: boolean
  invite_code: string
  wake_time: string
  bed_time: string
}

const timeInput = 'min-h-11 px-3 rounded-2xl border-2 border-line-strong'

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [color, setColor] = useState(COLORS[0])
  const [wake, setWake] = useState('07:00')
  const [bed, setBed] = useState('21:00')
  const [hasDevice, setHasDevice] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/pais/children', { cache: 'no-store' })
    if (res.ok) setChildren(await res.json())
  }
  useEffect(() => {
    load()
  }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (wake >= bed) return alert('A hora de acordar precisa ser antes da hora de dormir.')
    setSaving(true)
    const res = await fetch('/api/pais/children', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, avatar, color, wakeTime: wake, bedTime: bed, hasDevice }),
    })
    setSaving(false)
    if (res.ok) {
      setName('')
      await load()
    } else {
      alert('Não foi possível cadastrar.')
    }
  }

  async function patch(c: Child, body: Record<string, unknown>) {
    const res = await fetch(`/api/pais/children/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error || 'Não foi possível salvar.')
    }
    await load()
  }

  async function resetPin(c: Child) {
    if (!confirm(`Apagar o código secreto de ${c.name}? Na próxima entrada ${c.name} escolhe um novo.`)) return
    const res = await fetch(`/api/pais/children/${c.id}/reset-pin`, { method: 'POST' })
    if (res.ok) await load()
  }

  async function copyLink(c: Child) {
    await navigator.clipboard.writeText(`${window.location.origin}/filho?c=${c.invite_code}`)
    setCopied(c.id)
    setTimeout(() => setCopied(null), 2000)
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
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 font-bold text-ink">
            <Sun size={18} /> Acorda às
            <input type="time" required value={wake} onChange={(e) => setWake(e.target.value)} className={timeInput} />
          </label>
          <label className="flex items-center gap-2 font-bold text-ink">
            <Moon size={18} /> Dorme às
            <input type="time" required value={bed} onChange={(e) => setBed(e.target.value)} className={timeInput} />
          </label>
        </div>
        <label className="flex items-start gap-3 text-ink">
          <input type="checkbox" checked={hasDevice} onChange={(e) => setHasDevice(e.target.checked)} className="mt-1 w-5 h-5 accent-[var(--brand)]" />
          <span>
            <span className="font-bold">Tem celular ou computador</span>
            <span className="block text-sm text-ink-muted">
              Gera um link só dela, para ver as tarefas e avisar que fez no próprio aparelho.
            </span>
          </span>
        </label>
        <button disabled={saving} className="tf-btn tf-btn--primary">
          <Plus size={20} />
          Adicionar criança
        </button>
      </form>

      {children.length === 0 ? (
        <p className="text-center text-ink-muted">Nenhuma criança cadastrada ainda.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {children.map((c) => (
            <div key={c.id} className="bg-surface-raised p-6 rounded-[24px] border-2 border-line flex flex-col gap-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div
                  className="tf-child"
                  style={{ '--kid': c.color, '--kid-soft': `color-mix(in srgb, ${c.color} 14%, var(--surface-raised))` } as React.CSSProperties}
                >
                  <span className="tf-child__avatar" style={{ ['--size' as string]: '64px', borderWidth: 4, boxShadow: 'none' }}>{c.avatar}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-ink">{c.name}</h3>
                  <p className="text-ink-muted text-sm">{c.points} pontos</p>
                </div>
                <button onClick={() => remove(c)} aria-label={`Remover ${c.name}`} className="p-2 text-ink-muted hover:text-returned-fg">
                  <Trash2 size={20} />
                </button>
              </div>

              <Link href={`/pais/criancas/${c.id}`} className="tf-btn tf-btn--secondary">
                <ListChecks className="tf-icon" /> Ver tarefas de {c.name}
              </Link>

              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 text-sm font-bold text-ink">
                  <Sun size={16} />
                  <input
                    type="time"
                    defaultValue={c.wake_time}
                    key={`w-${c.wake_time}`}
                    onBlur={(e) => e.target.value && e.target.value !== c.wake_time && patch(c, { wakeTime: e.target.value })}
                    className={timeInput}
                    aria-label={`${c.name} acorda às`}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-bold text-ink">
                  <Moon size={16} />
                  <input
                    type="time"
                    defaultValue={c.bed_time}
                    key={`b-${c.bed_time}`}
                    onBlur={(e) => e.target.value && e.target.value !== c.bed_time && patch(c, { bedTime: e.target.value })}
                    className={timeInput}
                    aria-label={`${c.name} dorme às`}
                  />
                </label>
              </div>

              <label className="flex items-center gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={c.has_device}
                  onChange={(e) => patch(c, { hasDevice: e.target.checked })}
                  className="w-5 h-5 accent-[var(--brand)]"
                />
                <span className="font-bold flex items-center gap-1"><Smartphone size={16} /> Tem celular ou computador</span>
              </label>

              {c.has_device && (
                <div className="bg-sun-soft rounded-2xl p-3 space-y-2">
                  <p className="text-sm text-ink break-all">{`/filho?c=${c.invite_code}`}</p>
                  <p className="text-xs text-ink-muted">
                    Mande este link para {c.name}. Na primeira vez, ela escolhe um código secreto e pode instalar o app para
                    receber notificações.
                  </p>
                  <button onClick={() => copyLink(c)} className="tf-btn tf-btn--primary !min-h-10">
                    <Copy size={16} /> {copied === c.id ? 'Copiado!' : 'Copiar link da criança'}
                  </button>
                </div>
              )}

              <p className="text-sm text-ink-muted flex items-center gap-2 flex-wrap">
                <KeyRound size={16} />
                {c.has_pin ? 'Código secreto definido.' : 'Ainda não escolheu o código secreto.'}
                {c.has_pin && (
                  <button onClick={() => resetPin(c)} className="font-bold text-brand-ink underline">Redefinir</button>
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
