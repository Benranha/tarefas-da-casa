"use client";
import React, { useState } from 'react';
import { Mail } from 'lucide-react';

type Mode = 'idle' | 'confirm' | 'other';

// Envia o link da criança por e-mail. Guarda o e-mail; ao reenviar, confirma se é o mesmo ou deixa trocar.
export default function EnviarLink({
  childId, name, savedEmail, sentAt, onSent,
}: {
  childId: string
  name: string
  savedEmail: string | null
  sentAt: string | null
  onSent: () => void | Promise<void>
}) {
  const [mode, setMode] = useState<Mode>('idle');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function send(to?: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/pais/children/${childId}/send-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(to ? { email: to } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg({ ok: true, text: `Link enviado para ${data.email}.` });
        setMode('idle');
        setEmail('');
        await onSent();
      } else {
        setMsg({ ok: false, text: data.error || 'Não foi possível enviar.' });
      }
    } catch {
      setMsg({ ok: false, text: 'Sem conexão. Tente de novo.' });
    } finally {
      setBusy(false);
    }
  }

  const input = (
    <form onSubmit={(e) => { e.preventDefault(); send(email.trim()); }} className="space-y-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        maxLength={254}
        placeholder={`E-mail de ${name}`}
        aria-label={`E-mail de ${name}`}
        className="w-full min-h-11 px-3 rounded-2xl border-2 border-line focus:border-brand outline-none bg-surface-raised"
      />
      <div className="flex flex-wrap gap-2">
        <button disabled={busy || !email.trim()} className="tf-btn tf-btn--primary !min-h-10">
          <Mail size={16} /> {savedEmail ? 'Enviar para o novo e-mail' : 'Enviar link por e-mail'}
        </button>
        {savedEmail && (
          <button type="button" onClick={() => { setMode('idle'); setEmail(''); }} className="tf-btn tf-btn--secondary !min-h-10">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );

  return (
    <div className="space-y-2">
      {!savedEmail ? (
        input
      ) : mode === 'other' ? (
        input
      ) : mode === 'confirm' ? (
        <div className="space-y-2">
          <p className="text-sm text-ink">
            Enviar de novo para <strong className="break-all">{savedEmail}</strong>? Esse ainda é o e-mail de {name}?
          </p>
          <div className="flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => send()} className="tf-btn tf-btn--primary !min-h-10">
              Sim, enviar de novo
            </button>
            <button disabled={busy} onClick={() => setMode('other')} className="tf-btn tf-btn--secondary !min-h-10">
              É outro e-mail
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-ink">
            Último envio para <strong className="break-all">{savedEmail}</strong>
            {sentAt && <> em {new Date(sentAt).toLocaleDateString('pt-BR')}</>}.
          </p>
          <button onClick={() => { setMsg(null); setMode('confirm'); }} className="tf-btn tf-btn--secondary !min-h-10">
            <Mail size={16} /> Enviar link de novo
          </button>
        </div>
      )}
      {msg && (
        <p role="status" className={`text-sm font-bold ${msg.ok ? 'text-approved-fg' : 'text-returned-fg'}`}>{msg.text}</p>
      )}
    </div>
  );
}
