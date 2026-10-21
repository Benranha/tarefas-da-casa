import React from 'react';
import type { Msg } from './useAjudaChat';

// Balão de mensagem; quando a IA propõe uma ação, mostra o resumo com Confirmar/Cancelar.
export default function AjudaMensagem({
  msg,
  busy,
  onConfirm,
}: {
  msg: Msg;
  busy: boolean;
  onConfirm: (accept: boolean) => void;
}) {
  return (
    <div
      className={
        msg.role === 'user'
          ? 'ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-brand text-on-brand px-4 py-2.5 whitespace-pre-wrap'
          : 'mr-auto max-w-[85%] rounded-2xl rounded-bl-md bg-surface-raised border border-line px-4 py-2.5 whitespace-pre-wrap'
      }
    >
      {msg.text}
      {msg.proposal && !msg.settled && (
        <div className="mt-3 space-y-2">
          <div className="rounded-xl bg-surface-sunken px-3 py-2 text-sm font-bold">{msg.proposal.resumo}</div>
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => onConfirm(true)} className="px-4 py-1.5 rounded-full bg-brand text-on-brand text-sm font-bold disabled:opacity-50">
              Confirmar
            </button>
            <button type="button" disabled={busy} onClick={() => onConfirm(false)} className="px-4 py-1.5 rounded-full border border-line text-sm font-bold disabled:opacity-50">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
