'use client'
import React, { useEffect, useState } from 'react'
import { Copy, KeyRound, Link2, Plus, UserPlus } from 'lucide-react'
import PushToggle from '@/components/PushToggle'

type Member = { id: string; name: string; email: string; is_owner: boolean }
type Invite = { code: string; expires_at: string }

export default function FamilyPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [me, setMe] = useState('')
  const [totemUrl, setTotemUrl] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [hasParental, setHasParental] = useState(false)
  const [parentalPin, setParentalPin] = useState('')
  const [parentalMsg, setParentalMsg] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/pais/family', { cache: 'no-store' })
    if (!res.ok) return
    const f = await res.json()
    setMembers(f.members)
    setInvites(f.invites)
    setMe(f.me)
    setHasParental(Boolean(f.hasParentalCode))
    setTotemUrl(`${window.location.origin}/totem?c=${f.totemCode}`)
  }
  useEffect(() => {
    load()
  }, [])

  const inviteUrl = (code: string) => `${window.location.origin}/convite?c=${code}`

  async function createInvite() {
    setBusy(true)
    const res = await fetch('/api/pais/family/invite', { method: 'POST' })
    setBusy(false)
    if (res.ok) await load()
    else alert('Não foi possível criar o convite.')
  }

  async function saveParental(e: React.FormEvent) {
    e.preventDefault()
    setParentalMsg(null)
    const res = await fetch('/api/pais/family/parental-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: parentalPin }),
    })
    if (res.ok) {
      setParentalPin('')
      setParentalMsg('Código salvo.')
      await load()
    } else {
      const data = await res.json().catch(() => ({}))
      setParentalMsg(data.error || 'Não foi possível salvar.')
    }
  }

  async function removeParental() {
    if (!confirm('Remover o código parental? O "Trocar modo" do totem volta a abrir sem pedir código.')) return
    const res = await fetch('/api/pais/family/parental-code', { method: 'DELETE' })
    if (res.ok) {
      setParentalMsg('Código removido.')
      await load()
    }
  }

  async function copy(key: string, text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="font-display text-3xl font-semibold text-ink">Família</h1>

      <section className="tf-card space-y-4">
        <h2 className="font-display text-2xl font-semibold text-ink flex items-center gap-2">
          <UserPlus size={24} /> Convidar pai ou mãe
        </h2>
        <p className="text-ink-muted">
          Gere um link e mande para quem vai cuidar das tarefas com você. Quem abrir o link cria a conta (ou entra) e
          passa a ver as mesmas crianças, tarefas e prêmios. Cada link vale para uma pessoa e dura 7 dias.
        </p>
        <button onClick={createInvite} disabled={busy} className="tf-btn tf-btn--primary">
          <Plus className="tf-icon" /> Gerar link de convite
        </button>
        {invites.length > 0 && (
          <ul className="space-y-3">
            {invites.map((i) => (
              <li key={i.code} className="flex flex-col md:flex-row md:items-center gap-2 bg-sun-soft rounded-2xl p-3">
                <span className="flex-1 min-w-0 text-sm text-ink truncate">
                  {inviteUrl(i.code)}
                  <span className="block text-xs text-ink-muted">
                    Vale até {new Date(i.expires_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                </span>
                <button onClick={() => copy(i.code, inviteUrl(i.code))} className="tf-btn tf-btn--secondary !min-h-10">
                  <Copy size={16} /> {copied === i.code ? 'Copiado!' : 'Copiar'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="tf-card space-y-3">
        <h2 className="font-display text-2xl font-semibold text-ink">Responsáveis</h2>
        <ul className="divide-y divide-line">
          {members.map((m) => (
            <li key={m.id} className="py-3 flex items-center gap-3">
              <span className="flex-1 min-w-0">
                <span className="font-bold text-ink">{m.name || m.email}</span>
                {m.id === me && <span className="text-sm text-ink-muted"> (você)</span>}
                <span className="block text-sm text-ink-muted truncate">{m.email}</span>
              </span>
              {m.is_owner && <span className="px-3 py-1 bg-brand-soft text-brand-ink rounded-full text-xs font-bold">Criou a família</span>}
            </li>
          ))}
        </ul>
      </section>

      {totemUrl && (
        <section className="tf-card space-y-3">
          <h2 className="font-display text-2xl font-semibold text-ink flex items-center gap-2">
            <Link2 size={24} /> Link do totem (tablet das crianças)
          </h2>
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <p className="flex-1 min-w-0 text-sm text-ink-muted truncate">{totemUrl}</p>
            <button onClick={() => copy('totem', totemUrl)} className="tf-btn tf-btn--primary">
              <Copy size={18} /> {copied === 'totem' ? 'Copiado!' : 'Copiar link'}
            </button>
          </div>
        </section>
      )}

      <section className="tf-card space-y-3">
        <h2 className="font-display text-2xl font-semibold text-ink flex items-center gap-2">
          <KeyRound size={24} /> Código parental
        </h2>
        <p className="text-ink-muted">
          Protege o botão &quot;Trocar modo&quot; do totem: sem o código, as crianças não conseguem reconfigurar o tablet.
          {hasParental ? ' Você já definiu um código.' : ' Ainda não há código: o botão abre direto.'}
        </p>
        <form onSubmit={saveParental} className="flex flex-col sm:flex-row gap-3">
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            maxLength={8}
            value={parentalPin}
            onChange={(e) => setParentalPin(e.target.value.replace(/\D/g, ''))}
            placeholder="4 a 8 números"
            aria-label="Código parental"
            className="flex-1 min-h-12 px-5 rounded-full border-2 border-line-strong"
          />
          <button className="tf-btn tf-btn--primary">{hasParental ? 'Trocar código' : 'Definir código'}</button>
          {hasParental && (
            <button type="button" onClick={removeParental} className="tf-btn tf-btn--secondary">Remover</button>
          )}
        </form>
        {parentalMsg && <p role="status" className="text-sm font-bold text-ink">{parentalMsg}</p>}
      </section>

      <section className="tf-card space-y-3">
        <h2 className="font-display text-2xl font-semibold text-ink">Notificações</h2>
        <p className="text-ink-muted">Receba um aviso neste aparelho quando uma criança terminar uma tarefa.</p>
        <PushToggle endpoint="/api/pais/push" />
      </section>
    </div>
  )
}
