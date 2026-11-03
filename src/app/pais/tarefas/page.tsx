'use client'
import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Calendar, AlarmClock, Pencil, Check, EllipsisVertical, Copy, X } from 'lucide-react'
import TfIcon, { isCustomEmoji } from '@/components/TfIcon'
import { TF_GROUPS } from '@/lib/tf-icons-data'

type Child = { id: string; name: string; wake_time: string; bed_time: string }
type Mode = 'daily' | 'weekly' | 'once'
type Task = {
  id: string
  title: string
  description: string | null
  icon: string
  points: number
  due_time: string | null
  recurrence: 'daily' | 'weekly' | 'none' | null
  recurrence_days: string[] | null
  child_name: string
  assigned_child_id: string
}
type Draft = {
  title: string
  description: string
  icon: string
  points: number
  childId: string
  dueTime: string
  mode: Mode
  days: string[]
}

const ICONS = TF_GROUPS.tarefas
const DAYS = [
  ['mon', 'Seg', 'Segunda'],
  ['tue', 'Ter', 'Terça'],
  ['wed', 'Qua', 'Quarta'],
  ['thu', 'Qui', 'Quinta'],
  ['fri', 'Sex', 'Sexta'],
  ['sat', 'Sáb', 'Sábado'],
  ['sun', 'Dom', 'Domingo'],
] as const
const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri']
const WEEKEND = ['sat', 'sun']

const window_for = (children: Child[], id: string) => children.find((c) => c.id === id)

function daysLabel(days: string[] | null) {
  if (!days || days.length === 0) return null
  if (days.length === 5 && WEEKDAYS.every((d) => days.includes(d))) return 'Seg a Sex'
  if (days.length === 2 && WEEKEND.every((d) => days.includes(d))) return 'Sáb e Dom'
  return DAYS.filter(([k]) => days.includes(k)).map(([, short]) => short).join(', ')
}

function draftFromTask(t: Task): Draft {
  return {
    title: t.title,
    description: t.description ?? '',
    icon: t.icon,
    points: t.points,
    childId: t.assigned_child_id,
    dueTime: t.due_time ?? '',
    mode: t.recurrence === 'none' ? 'once' : t.recurrence === 'weekly' ? 'weekly' : 'daily',
    days: t.recurrence_days ?? [],
  }
}

// Formulário único para cadastrar e para editar: todos os campos da tarefa.
function TaskForm({
  kids,
  initial,
  submitLabel,
  saving,
  onSubmit,
  onCancel,
}: {
  kids: Child[]
  initial: Draft
  submitLabel: string
  saving: boolean
  onSubmit: (d: Draft) => void
  onCancel?: () => void
}) {
  const [d, setD] = useState<Draft>(initial)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((cur) => ({ ...cur, [k]: v }))
  const kid = window_for(kids, d.childId)
  const knownIcon = (ICONS as readonly string[]).includes(d.icon)
  const toggleDay = (k: string) => set('days', d.days.includes(k) ? d.days.filter((x) => x !== k) : [...d.days, k])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (d.mode === 'weekly' && d.days.length === 0) {
      alert('Escolha pelo menos um dia da semana.')
      return
    }
    onSubmit(d)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input
        value={d.title}
        onChange={(e) => set('title', e.target.value)}
        required
        maxLength={80}
        placeholder="Ex.: Arrumar o quarto"
        aria-label="Nome da tarefa"
        className="w-full p-3 rounded-2xl border-2 border-line focus:border-brand outline-none"
      />
      <input
        value={d.description}
        onChange={(e) => set('description', e.target.value)}
        maxLength={500}
        placeholder="Detalhes (opcional): o que precisa ser feito"
        aria-label="Detalhes"
        className="w-full p-3 rounded-2xl border-2 border-line focus:border-brand outline-none"
      />
      <div className="flex flex-wrap gap-2">
        {ICONS.map((i) => (
          <button
            type="button"
            key={i}
            onClick={() => set('icon', i)}
            aria-label={`Ícone ${i}`}
            aria-pressed={d.icon === i}
            className={`p-2 rounded-2xl border-2 ${d.icon === i ? 'border-brand bg-surface-sunken' : 'border-transparent'}`}
          >
            <TfIcon name={i} size={34} />
          </button>
        ))}
      </div>
      <label className="flex items-center gap-3 text-sm font-bold text-ink">
        <span className={`size-11 grid place-items-center rounded-2xl border-2 ${!knownIcon && isCustomEmoji(d.icon) ? 'border-brand bg-surface-sunken' : 'border-line'}`}>
          {!knownIcon && isCustomEmoji(d.icon) ? <TfIcon name={d.icon} size={30} /> : <span aria-hidden>🙂</span>}
        </span>
        <span className="flex-1">
          Outro ícone: escreva um emoji
          <input
            value={!knownIcon && isCustomEmoji(d.icon) ? d.icon : ''}
            onChange={(e) => {
              const v = e.target.value.trim()
              if (v) set('icon', v.slice(0, 8))
              else if (!knownIcon) set('icon', ICONS[0])
            }}
            placeholder="Ex.: ☕ para arrumar a cafeteira"
            aria-label="Emoji personalizado"
            className="mt-1 w-full p-2 rounded-xl border-2 border-line focus:border-brand outline-none font-normal"
          />
        </span>
      </label>
      <div className="flex flex-col md:flex-row gap-3">
        <select
          value={d.childId}
          onChange={(e) => set('childId', e.target.value)}
          aria-label="Criança"
          className="flex-1 p-3 rounded-2xl border-2 border-line"
        >
          {kids.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          max={1000}
          value={d.points}
          onChange={(e) => set('points', Number(e.target.value))}
          className="md:w-32 p-3 rounded-2xl border-2 border-line"
          aria-label="Pontos"
        />
        <label className="flex items-center gap-2 font-bold text-ink">
          <AlarmClock size={18} /> Horário
          <input
            type="time"
            value={d.dueTime}
            min={kid?.wake_time}
            max={kid?.bed_time}
            onChange={(e) => set('dueTime', e.target.value)}
            className="min-h-11 px-3 rounded-2xl border-2 border-line"
          />
        </label>
      </div>
      {kid && (
        <p className="text-sm text-ink-muted">
          {kid.name} acorda às {kid.wake_time} e dorme às {kid.bed_time}. O horário da tarefa fica entre os dois (opcional).
        </p>
      )}
      <div role="radiogroup" aria-label="Quando acontece" className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {([
          ['daily', 'Todos os dias', 'Repete diariamente'],
          ['weekly', 'Dias da semana', 'Ex.: só de segunda a sexta'],
          ['once', 'Só hoje', 'Avulsa: não repete amanhã'],
        ] as const).map(([value, label, hint]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={d.mode === value}
            onClick={() => set('mode', value)}
            className={`p-3 rounded-2xl border-2 text-left ${d.mode === value ? 'border-brand bg-surface-sunken' : 'border-line'}`}
          >
            <span className="block font-extrabold text-ink">{label}</span>
            <span className="block text-sm text-ink-muted">{hint}</span>
          </button>
        ))}
      </div>
      {d.mode === 'weekly' && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Dias da semana">
            {DAYS.map(([k, short, full]) => (
              <button
                key={k}
                type="button"
                aria-pressed={d.days.includes(k)}
                aria-label={full}
                onClick={() => toggleDay(k)}
                className={`min-h-11 min-w-14 px-3 rounded-full border-2 font-extrabold ${d.days.includes(k) ? 'border-brand bg-brand text-white' : 'border-line text-ink'}`}
              >
                {short}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <button type="button" onClick={() => set('days', WEEKDAYS)} className="px-3 py-1.5 rounded-full bg-surface-sunken font-bold text-ink">
              Segunda a sexta
            </button>
            <button type="button" onClick={() => set('days', WEEKEND)} className="px-3 py-1.5 rounded-full bg-surface-sunken font-bold text-ink">
              Fim de semana
            </button>
          </div>
        </div>
      )}
      <p className="text-sm text-ink-muted flex items-center gap-1">
        <Calendar size={14} />{' '}
        {d.mode === 'once'
          ? 'A tarefa aparece só hoje, no totem e no aparelho da criança, e não volta amanhã.'
          : d.mode === 'weekly'
            ? `A tarefa aparece ${d.days.length ? `toda ${daysLabel(d.days)}`.replace('toda Seg a Sex', 'de segunda a sexta') : 'nos dias que você escolher'}, no totem e no aparelho da criança.`
            : 'A tarefa aparece todos os dias, no totem e no aparelho da criança.'}
      </p>
      <div className="flex flex-wrap gap-3">
        <button disabled={saving} className="tf-btn tf-btn--primary">
          {onCancel ? <Check size={20} /> : <Plus size={20} />}
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="tf-btn !min-h-11">
            <X size={18} /> Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [last, setLast] = useState<Draft | null>(null) // última tarefa cadastrada: serve de ponto de partida da próxima
  const [copyFrom, setCopyFrom] = useState('')
  const [copyTo, setCopyTo] = useState('')
  const [copyOpen, setCopyOpen] = useState(false)
  const [copyPick, setCopyPick] = useState<string[] | null>(null) // null = todas

  async function load() {
    const [t, c] = await Promise.all([
      fetch('/api/pais/tasks', { cache: 'no-store' }),
      fetch('/api/pais/children', { cache: 'no-store' }),
    ])
    if (t.ok) setTasks(await t.json())
    if (c.ok) {
      const list: Child[] = await c.json()
      setChildren(list)
      setCopyFrom((cur) => cur || list[0]?.id || '')
      setCopyTo((cur) => cur || list[1]?.id || '')
    }
  }
  useEffect(() => {
    load()
  }, [])

  const body = (d: Draft) =>
    JSON.stringify({
      title: d.title,
      description: d.description,
      icon: d.icon,
      points: d.points,
      childId: d.childId,
      dueTime: d.dueTime,
      recurrence: d.mode === 'once' ? 'none' : d.mode,
      days: d.mode === 'weekly' ? d.days : [],
    })

  async function save(d: Draft, url: string, method: 'POST' | 'PATCH') {
    setSaving(true)
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body(d) })
    setSaving(false)
    if (res.ok) {
      setEditing(null)
      // Mantém criança, ícone, pontos e dias para cadastrar a próxima tarefa rápido; limpa só o texto.
      if (method === 'POST') {
        setLast(d)
        setFormKey((k) => k + 1)
      }
      await load()
      return true
    }
    const data = await res.json().catch(() => ({}))
    alert(data.error || 'Não foi possível salvar a tarefa.')
    return false
  }

  const copyTasks = tasks.filter((t) => t.assigned_child_id === copyFrom)
  async function doCopy() {
    setSaving(true)
    const res = await fetch('/api/pais/tasks/copiar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromChildId: copyFrom, toChildId: copyTo, taskIds: copyPick ?? undefined }),
    })
    setSaving(false)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return alert(data.error || 'Não foi possível copiar.')
    alert(
      `${data.copied} ${data.copied === 1 ? 'tarefa copiada' : 'tarefas copiadas'}` +
        (data.skipped ? `. ${data.skipped} já existia${data.skipped === 1 ? '' : 'm'} e ficou${data.skipped === 1 ? '' : 'ram'} de fora.` : '.'),
    )
    setCopyOpen(false)
    await load()
  }

  function startCopy(t: Task) {
    setCopyFrom(t.assigned_child_id)
    setCopyTo(children.find((c) => c.id !== t.assigned_child_id)?.id ?? '')
    setCopyPick([t.id])
    setCopyOpen(true)
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
        <div className="bg-surface-raised p-6 rounded-[24px] border-2 border-line space-y-4">
          <TaskForm
            key={formKey}
            kids={children}
            initial={{ ...(last ?? { icon: ICONS[0], points: 10, childId: children[0].id, mode: 'daily', days: WEEKDAYS }), title: '', description: '', dueTime: '' }}
            submitLabel="Adicionar tarefa"
            saving={saving}
            onSubmit={(d) => save(d, '/api/pais/tasks', 'POST')}
          />
        </div>
      )}

      {children.length > 1 && tasks.length > 0 && (
        <div className="bg-surface-raised p-4 rounded-[24px] border-2 border-line space-y-3">
          <button
            type="button"
            onClick={() => { setCopyPick(null); setCopyOpen((o) => !o) }}
            aria-expanded={copyOpen}
            className="w-full min-h-11 flex items-center gap-2 font-extrabold text-ink text-left"
          >
            <Copy size={18} /> Copiar tarefas de uma criança para outra
          </button>
          {copyOpen && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <select value={copyFrom} onChange={(e) => { setCopyFrom(e.target.value); setCopyPick(null) }} aria-label="Copiar de" className="flex-1 p-3 rounded-2xl border-2 border-line">
                  {children.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <span className="font-bold text-ink-muted text-center">para</span>
                <select value={copyTo} onChange={(e) => setCopyTo(e.target.value)} aria-label="Copiar para" className="flex-1 p-3 rounded-2xl border-2 border-line">
                  {children.filter((c) => c.id !== copyFrom).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {copyTasks.length === 0 ? (
                <p className="text-sm text-ink-muted">Essa criança ainda não tem tarefas.</p>
              ) : (
                <ul className="space-y-1">
                  {copyTasks.map((t) => {
                    const checked = copyPick === null || copyPick.includes(t.id)
                    return (
                      <li key={t.id}>
                        <label className="flex items-center gap-3 min-h-11 text-ink">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const cur = copyPick ?? copyTasks.map((x) => x.id)
                              setCopyPick(cur.includes(t.id) ? cur.filter((x) => x !== t.id) : [...cur, t.id])
                            }}
                            className="size-5 accent-[var(--brand,#C0430E)]"
                          />
                          <TfIcon name={t.icon} size={24} />
                          <span className="font-medium">{t.title}</span>
                          {t.due_time && <span className="text-sm text-ink-muted">{t.due_time}</span>}
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
              <p className="text-sm text-ink-muted">Tarefas que a outra criança já tem não são repetidas. Horário, dias e pontos vão junto.</p>
              <button
                type="button"
                disabled={saving || !copyTo || (copyPick !== null && copyPick.length === 0)}
                onClick={doCopy}
                className="tf-btn tf-btn--primary"
              >
                <Copy size={18} /> Copiar {copyPick === null ? 'todas' : copyPick.length} {copyPick !== null && copyPick.length === 1 ? 'tarefa' : 'tarefas'}
              </button>
            </div>
          )}
        </div>
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
                  {t.recurrence === 'none' && (
                    <span className="px-3 py-1 bg-sun-soft text-ink rounded-full text-xs font-bold whitespace-nowrap">Só hoje</span>
                  )}
                  {t.recurrence === 'weekly' && daysLabel(t.recurrence_days) && (
                    <span className="px-3 py-1 bg-sun-soft text-ink rounded-full text-xs font-bold whitespace-nowrap">{daysLabel(t.recurrence_days)}</span>
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
                          onClick={() => { setMenuFor(null); setEditing(editing === t.id ? null : t.id) }}
                          className="w-full min-h-11 px-3 flex items-center gap-3 rounded-xl font-extrabold text-ink hover:bg-surface-sunken"
                        >
                          <Pencil size={18} /> Editar
                        </button>
                        {children.length > 1 && (
                          <button
                            role="menuitem"
                            onClick={() => { setMenuFor(null); startCopy(t) }}
                            className="w-full min-h-11 px-3 flex items-center gap-3 rounded-xl font-extrabold text-ink hover:bg-surface-sunken"
                          >
                            <Copy size={18} /> Copiar para…
                          </button>
                        )}
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
                <TaskForm
                  key={t.id}
                  kids={children}
                  initial={draftFromTask(t)}
                  submitLabel="Salvar"
                  saving={saving}
                  onSubmit={(d) => save(d, `/api/pais/tasks/${t.id}`, 'PATCH')}
                  onCancel={() => setEditing(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
