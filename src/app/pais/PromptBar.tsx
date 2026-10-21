"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, X } from 'lucide-react';
import AjudaMensagem from './AjudaMensagem';
import { useAjudaChat } from './useAjudaChat';

const SUGGESTIONS = ['Crie uma tarefa para uma criança', 'O que está na Fila?', 'Quais tarefas já existem?'];

// Barra de comando no topo da Fila: o responsável pede em linguagem natural (criar tarefa,
// aprovar, devolver…) e confirma no próprio cartão. onChanged atualiza a Fila após cada ação.
export default function PromptBar({ onChanged }: { onChanged: () => void }) {
  const { msgs, busy, send, confirm, reset } = useAjudaChat([], onChanged);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [msgs, busy]);

  function submit(question: string) {
    if (!question.trim() || busy) return;
    setText('');
    send(question);
  }

  return (
    <section aria-label="Peça ao Tarefinha" className="order-1 tf-card text-ink !p-3 md:!p-4 flex flex-col gap-3">
      {msgs.length > 0 && (
        <div className="relative">
          <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
            {msgs.map((m, i) => (
              <AjudaMensagem key={i} msg={m} busy={busy} onConfirm={(accept) => confirm(i, accept)} />
            ))}
            {busy && <div className="mr-auto text-ink-muted text-sm font-bold">Pensando…</div>}
            <div ref={endRef} />
          </div>
          <button
            type="button"
            onClick={reset}
            disabled={busy}
            aria-label="Limpar conversa"
            className="absolute -top-1 -right-1 p-1.5 rounded-full bg-surface-sunken text-ink-muted hover:text-ink disabled:opacity-50"
          >
            <X size={14} />
          </button>
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(text);
        }}
        className="flex items-center gap-2"
      >
        <Sparkles size={20} className="shrink-0 text-brand ml-1" aria-hidden />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          placeholder="Peça algo… ex.: crie “arrumar a cama” para a Ana, 10 pontos"
          aria-label="Peça ao Tarefinha"
          className="flex-1 min-w-0 p-3 rounded-2xl border-2 border-line bg-surface text-ink placeholder:text-ink-muted focus:border-brand outline-none"
        />
        <button type="submit" disabled={busy || !text.trim()} aria-label="Enviar" className="p-3 rounded-2xl bg-brand text-on-brand disabled:opacity-50">
          <Send size={20} />
        </button>
      </form>
      {msgs.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => submit(s)} className="px-3 py-1.5 rounded-full border border-line bg-surface-sunken text-ink text-sm font-bold">
              {s}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
