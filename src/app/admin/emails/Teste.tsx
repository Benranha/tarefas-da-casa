"use client";
import React, { useState } from 'react';

export default function TesteEmail() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function enviar() {
    if (busy) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/emails/teste', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setResult({ ok: true, text: `Enviado para ${data.para}. Confira a caixa de entrada e o spam.` });
      else setResult({ ok: false, text: data.error || 'Não deu certo. Tente de novo.' });
    } catch {
      setResult({ ok: false, text: 'Não deu certo. Tente de novo.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ad-teste">
      <button type="button" className="tf-btn tf-btn--primary" disabled={busy} onClick={enviar}>
        {busy ? 'Enviando...' : 'Enviar e-mail de teste'}
      </button>
      {result && (
        <p role={result.ok ? 'status' : 'alert'} className={result.ok ? 'ad-ok' : 'ad-error'}>{result.text}</p>
      )}
    </div>
  );
}
