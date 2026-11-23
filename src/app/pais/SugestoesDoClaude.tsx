'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'

export type Sugestao = { id: string; resumo: string; app: string | null; criadaEm: string }

// Sugestões que o Claude deixou pelo conector. Nada acontece até o responsável tocar em Confirmar:
// é a mesma regra do assistente do painel (a IA só propõe).
export default function SugestoesDoClaude({ sugestoes, onChanged }: { sugestoes: Sugestao[]; onChanged: () => void }) {
  const [ocupada, setOcupada] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  async function decidir(id: string, acao: 'confirmar' | 'recusar') {
    if (ocupada) return
    setOcupada(id)
    setAviso(null)
    const res = await fetch(`/api/pais/propostas/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao }),
    }).catch(() => null)
    const dados = res ? await res.json().catch(() => null) : null
    setAviso(res ? (dados?.message ?? dados?.error ?? null) : 'Sem conexão. Tente de novo.')
    setOcupada(null)
    onChanged()
  }

  if (sugestoes.length === 0 && !aviso) return null

  const apps = [...new Set(sugestoes.map((s) => s.app).filter((a): a is string => Boolean(a)))]
  const quem = apps.length === 1 ? apps[0] : 'Claude'

  return (
    <section aria-label={`Sugestões do ${quem}`} className="order-2 md:order-3 tf-card !bg-sun-soft space-y-4 !p-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">
          {sugestoes.length === 1 ? `O ${quem} tem uma sugestão` : `O ${quem} tem ${sugestoes.length} sugestões`}
        </h2>
        <p className="text-sm text-ink-muted">Nada acontece até você confirmar.</p>
      </div>

      {sugestoes.length > 0 && (
        <ul className="space-y-3">
          {sugestoes.map((s) => (
            <li key={s.id} className="bg-surface-raised rounded-2xl p-4 flex flex-col gap-3">
              <p className="font-bold text-ink text-pretty">{s.resumo}</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={ocupada !== null}
                  onClick={() => decidir(s.id, 'recusar')}
                  className="tf-btn tf-btn--secondary !min-h-12 !px-3"
                >
                  <X className="tf-icon" /> Recusar
                </button>
                <button
                  type="button"
                  disabled={ocupada !== null}
                  onClick={() => decidir(s.id, 'confirmar')}
                  className="tf-btn tf-btn--approve !min-h-12 !px-3"
                >
                  <Check className="tf-icon" /> Confirmar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {aviso && (
        <p role="status" className="text-sm font-bold text-ink">
          {aviso}
        </p>
      )}
    </section>
  )
}
