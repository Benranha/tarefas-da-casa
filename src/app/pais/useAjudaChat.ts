import { useState } from 'react';

export type Proposal = { tool: string; args: Record<string, unknown>; resumo: string };
// local: mensagem só da tela (boas-vindas), não vai para a IA.
export type Msg = { role: 'user' | 'model'; text: string; proposal?: Proposal; settled?: boolean; local?: boolean };

// Conversa com a IA do painel dos pais (/api/pais/ajuda) e confirmação das ações que ela propõe.
// Usado pelo chat de Ajuda e pela barra de prompt da Fila. onChanged roda depois de uma ação confirmada.
export function useAjudaChat(initial: Msg[] = [], onChanged?: () => void) {
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [busy, setBusy] = useState(false);

  async function send(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: 'user', text: q }];
    setMsgs(next);
    setBusy(true);
    try {
      const res = await fetch('/api/pais/ajuda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.filter((m) => !m.local).map(({ role, text }) => ({ role, text })) }),
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
    if (!accept) return settle({ role: 'model', text: 'Tudo bem, não fiz nada.' });
    setBusy(true);
    try {
      const res = await fetch('/api/pais/ajuda/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: m.proposal.tool, args: m.proposal.args }),
      });
      const data = await res.json().catch(() => ({}));
      settle({ role: 'model', text: res.ok && data.message ? data.message : data.error || 'Não consegui fazer isso. Tente de novo.' });
      if (res.ok) onChanged?.();
    } catch {
      settle({ role: 'model', text: 'Sem conexão. Tente de novo.' });
    } finally {
      setBusy(false);
    }
  }

  return { msgs, busy, send, confirm, reset: () => setMsgs(initial) };
}
