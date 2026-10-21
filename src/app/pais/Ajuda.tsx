"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';
import AjudaMensagem from './AjudaMensagem';
import { useAjudaChat, type Msg } from './useAjudaChat';

const HELLO: Msg = {
  role: 'model',
  local: true,
  text: 'Oi! Sou a assistente do Tarefinha. Pergunte como cadastrar crianças, aprovar na Fila, usar o totem ou instalar o app. Também posso ver suas tarefas e criar novas para você (você confirma antes). Não digite senhas nem códigos secretos aqui.',
};
const SUGGESTIONS = ['Crie uma tarefa para uma criança', 'Quais tarefas já existem?', 'Como abro o totem no tablet?'];

export default function Ajuda({ onClose }: { onClose: () => void }) {
  const { msgs, busy, send, confirm } = useAjudaChat([HELLO]);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [msgs, busy]);

  function submit(question: string) {
    if (!question.trim() || busy) return;
    setText('');
    send(question);
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
            <AjudaMensagem key={i} msg={m} busy={busy} onConfirm={(accept) => confirm(i, accept)} />
          ))}
          {msgs.length === 1 && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => submit(s)} className="px-3 py-1.5 rounded-full border border-line bg-surface-raised text-sm font-bold">
                  {s}
                </button>
              ))}
            </div>
          )}
          {busy && <div className="mr-auto text-ink-muted text-sm font-bold">Digitando…</div>}
          <div ref={endRef} />
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); submit(text); }}
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
