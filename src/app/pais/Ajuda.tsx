"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';

type Proposal = { tool: 'criar_tarefa'; args: Record<string, unknown>; resumo: string };
type Msg = { role: 'user' | 'model'; text: string; proposal?: Proposal; settled?: boolean };

const HELLO: Msg = {
  role: 'model',
  text: 'Oi! Sou a assistente do Tarefinha. Pergunte como cadastrar crianças, aprovar na Fila, usar o totem ou instalar o app. Também posso ver suas tarefas e criar novas para você (você confirma antes). Não digite senhas nem códigos secretos aqui.',
};
const SUGGESTIONS = ['Crie uma tarefa para uma criança', 'Quais tarefas já existem?', 'Como abro o totem no tablet?'];

export default function Ajuda({ onClose }: { onClose: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([HELLO]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [msgs, busy]);

  async function send(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: 'user', text: q }];
    setMsgs(next);
    setText('');
    setBusy(true);
    try {
      const res = await fetch('/api/pais/ajuda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.filter((m) => m !== HELLO).map(({ role, text }) => ({ role, text })) }),
      });
      const data = await res.json().catch(() => ({}));
      const reply = res.ok && data.reply ? data.reply : data.error || 'Não consegui responder agora. Tente de novo.';
      setMsgs([...next, { role: 'model', text: reply, proposal: res.ok ? data.proposal : undefined }]);
    } catch {
      setMsgs([...next, { role: 'model', text: 'Sem conexão. Tente de novo.' }]);
    } finally {
      setBusy(false);
    }
  }

  async function confirm(index: number, accept: boolean) {
    const m = msgs[index];
    if (!m?.proposal || m.settled || busy) return;
    const settle = (extra: Msg) =>
      setMsgs((cur) => [...cur.map((x, i) => (i === index ? { ...x, settled: true } : x)), extra]);
    if (!accept) return settle({ role: 'model', text: 'Tudo bem, não criei nada.' });
    setBusy(true);
    try {
      const res = await fetch('/api/pais/ajuda/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: m.proposal.tool, args: m.proposal.args }),
      });
      const data = await res.json().catch(() => ({}));
      settle({ role: 'model', text: res.ok && data.message ? data.message : data.error || 'Não consegui criar a tarefa. Tente de novo.' });
    } catch {
      settle({ role: 'model', text: 'Sem conexão. Tente de novo.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/50 p-0 md:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ajuda"
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col w-full md:max-w-md h-[85vh] md:h-[600px] bg-surface text-ink rounded-t-[28px] md:rounded-[28px] shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="font-display font-bold text-xl">Ajuda</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="p-2 rounded-full hover:bg-surface-sunken">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={
                m.role === 'user'
                  ? 'ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-brand text-on-brand px-4 py-2.5 whitespace-pre-wrap'
                  : 'mr-auto max-w-[85%] rounded-2xl rounded-bl-md bg-surface-raised border border-line px-4 py-2.5 whitespace-pre-wrap'
              }
            >
              {m.text}
              {m.proposal && !m.settled && (
                <div className="mt-3 space-y-2">
                  <div className="rounded-xl bg-surface-sunken px-3 py-2 text-sm font-bold">{m.proposal.resumo}</div>
                  <div className="flex gap-2">
                    <button type="button" disabled={busy} onClick={() => confirm(i, true)} className="px-4 py-1.5 rounded-full bg-brand text-on-brand text-sm font-bold disabled:opacity-50">
                      Confirmar
                    </button>
                    <button type="button" disabled={busy} onClick={() => confirm(i, false)} className="px-4 py-1.5 rounded-full border border-line text-sm font-bold disabled:opacity-50">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {msgs.length === 1 && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => send(s)} className="px-3 py-1.5 rounded-full border border-line bg-surface-raised text-sm font-bold">
                  {s}
                </button>
              ))}
            </div>
          )}
          {busy && <div className="mr-auto text-ink-muted text-sm font-bold">Digitando…</div>}
          <div ref={endRef} />
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); send(text); }}
          className="flex items-center gap-2 p-3 border-t border-line bg-surface-raised"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            placeholder="Escreva sua dúvida…"
            aria-label="Sua dúvida"
            className="flex-1 min-w-0 p-3 rounded-2xl border-2 border-line bg-surface focus:border-brand outline-none"
          />
          <button type="submit" disabled={busy || !text.trim()} aria-label="Enviar" className="p-3 rounded-2xl bg-brand text-on-brand disabled:opacity-50">
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
