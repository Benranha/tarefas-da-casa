'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { ChevronDown, Moon, PartyPopper, Plus, Sun } from 'lucide-react'
import TfIcon from '@/components/TfIcon'
import { TF_GROUPS } from '@/lib/tf-icons-data'
import { KID_COLORS } from '@/lib/kid-options'

const AVATARS = TF_GROUPS.avatares
const ICONS = TF_GROUPS.tarefas
const SUGGESTIONS = [
  { title: 'Arrumar a cama', icon: 'cama' },
  { title: 'Escovar os dentes', icon: 'escova' },
  { title: 'Guardar os brinquedos', icon: 'brinquedos' },
  { title: 'Arrumar a mochila', icon: 'mochila' },
  { title: 'Ler um livro', icon: 'livro' },
]

const input = 'w-full p-3 rounded-2xl border-2 border-line focus:border-brand outline-none'
const timeInput = 'min-h-11 px-3 rounded-2xl border-2 border-line-strong'

export default function OnboardingFlow({
  userName,
  child: existingChild,
}: {
  userName: string
  child: { id: string; name: string } | null
}) {
  const router = useRouter()
  const [child, setChild] = useState(existingChild)
  const [finished, setFinished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Passo 1
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState<string>(AVATARS[0])
  const [color, setColor] = useState(KID_COLORS[0])
  const [more, setMore] = useState(false)
  const [wake, setWake] = useState('07:00')
  const [bed, setBed] = useState('21:00')
  const [hasDevice, setHasDevice] = useState(false)

  // Passo 2
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState<string>(ICONS[0])
  const [points, setPoints] = useState(10)

  const step = child ? 2 : 1

  async function post(url: string, body: unknown) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Não foi possível salvar. Tente de novo.')
        return null
      }
      return data
    } catch {
      setError('Sem conexão. Tente de novo.')
      return null
    } finally {
      setSaving(false)
    }
  }

  async function addChild(e: React.FormEvent) {
    e.preventDefault()
    if (wake >= bed) return setError('A hora de acordar precisa ser antes da hora de dormir.')
    const created = await post('/api/pais/children', { name, avatar, color, wakeTime: wake, bedTime: bed, hasDevice })
    if (created) setChild({ id: created.id, name: created.name })
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!child) return
    const created = await post('/api/pais/tasks', { title, icon, points, childId: child.id, recurrence: 'daily' })
    if (!created) return
    try {
      localStorage.setItem('tarefinha-tutorial-visto', '1')
    } catch {}
    setFinished(true)
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
    setTimeout(() => {
      router.replace('/pais')
      router.refresh()
    }, 1800)
  }

  const firstName = userName.split(' ')[0]

  return (
    <div className="tf-painel min-h-screen bg-surface flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-xl space-y-6">
        {finished ? (
          <div className="bg-surface-raised p-8 rounded-[32px] border-2 border-line text-center space-y-3">
            <PartyPopper size={48} className="mx-auto text-brand" />
            <h1 className="text-3xl font-bold text-ink">Tudo pronto!</h1>
            <p className="text-ink-muted">Já dá para {child?.name} começar. Levando você para o painel…</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-sm font-bold text-ink-muted">Passo {step} de 2</p>
              <div className="h-2 rounded-full bg-surface-sunken overflow-hidden" aria-hidden>
                <div className="h-full bg-brand transition-all" style={{ width: step === 1 ? '50%' : '100%' }} />
              </div>
              <h1 className="text-3xl font-bold text-ink">
                {step === 1
                  ? `${firstName ? `Olá, ${firstName}! ` : ''}Quem vai fazer as tarefas?`
                  : `Qual a primeira tarefa de ${child?.name}?`}
              </h1>
              <p className="text-ink-muted">
                {step === 1
                  ? 'Cadastre a primeira criança. Você pode adicionar outras depois.'
                  : 'Escolha uma sugestão ou escreva a sua. Ela se repete todos os dias.'}
              </p>
            </div>

            {step === 1 ? (
              <form onSubmit={addChild} className="bg-surface-raised p-6 rounded-[24px] border-2 border-line space-y-4">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  maxLength={40}
                  placeholder="Nome da criança"
                  className={input}
                />
                <div className="flex flex-wrap gap-2">
                  {AVATARS.map((a) => (
                    <button
                      type="button"
                      key={a}
                      onClick={() => setAvatar(a)}
                      className={`p-2 rounded-2xl border-2 ${avatar === a ? 'border-brand bg-surface-sunken' : 'border-transparent'}`}
                    >
                      <TfIcon name={a} size={40} color={color} />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {KID_COLORS.map((c) => (
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
                  type="button"
                  onClick={() => setMore((m) => !m)}
                  className="flex items-center gap-1 text-sm font-bold text-brand-ink"
                  aria-expanded={more}
                >
                  Mais opções <ChevronDown size={16} className={more ? 'rotate-180' : ''} />
                </button>
                {more && (
                  <div className="space-y-4">
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
                      <input
                        type="checkbox"
                        checked={hasDevice}
                        onChange={(e) => setHasDevice(e.target.checked)}
                        className="mt-1 w-5 h-5 accent-[var(--brand)]"
                      />
                      <span className="font-bold">Tem celular ou computador</span>
                    </label>
                  </div>
                )}

                {error && <p role="alert" className="text-returned-fg font-bold">{error}</p>}
                <button disabled={saving || !name.trim()} className="tf-btn tf-btn--primary w-full">
                  Continuar
                </button>
              </form>
            ) : (
              <form onSubmit={addTask} className="bg-surface-raised p-6 rounded-[24px] border-2 border-line space-y-4">
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      type="button"
                      key={s.title}
                      onClick={() => {
                        setTitle(s.title)
                        setIcon(s.icon)
                      }}
                      className={`px-3 py-2 rounded-full border-2 text-sm font-bold text-ink ${title === s.title ? 'border-brand bg-surface-sunken' : 'border-line'}`}
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={80}
                  placeholder="Ex.: Arrumar o quarto"
                  className={input}
                />
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setIcon(i)}
                      className={`p-2 rounded-2xl border-2 ${icon === i ? 'border-brand bg-surface-sunken' : 'border-transparent'}`}
                    >
                      <TfIcon name={i} size={36} />
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 font-bold text-ink">
                  Pontos
                  <input
                    type="number"
                    min={0}
                    max={1000}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-24 min-h-11 px-3 rounded-2xl border-2 border-line"
                  />
                </label>
                {error && <p role="alert" className="text-returned-fg font-bold">{error}</p>}
                <button disabled={saving || !title.trim()} className="tf-btn tf-btn--primary w-full">
                  <Plus size={20} /> Criar tarefa e começar
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
