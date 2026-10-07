"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FamilyActions({ id, email, status }: { id: string; email: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  async function run(action: 'estender' | 'cancelar') {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/assinantes/${id}/${action}`, { method: 'POST' });
      if (!res.ok) throw new Error();
      setConfirming(false);
      router.refresh();
    } catch {
      setError('Não deu certo. Tente de novo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ad-actions">
      {(status === 'trialing' || status === 'expired') && (
        <button type="button" className="tf-btn tf-btn--primary" disabled={busy} onClick={() => run('estender')}>Estender teste +7 dias</button>
      )}
      <a className="tf-btn tf-btn--secondary" href={`mailto:${email}`}>Enviar e-mail</a>
      {status !== 'canceled' && (confirming ? (
        <div className="ad-confirm" role="alertdialog" aria-label="Confirmar cancelamento">
          <p>Cancelar a assinatura desta família?</p>
          <div>
            <button type="button" className="tf-btn tf-btn--secondary" disabled={busy} onClick={() => setConfirming(false)}>Voltar</button>
            <button type="button" className="tf-btn tf-btn--return" disabled={busy} onClick={() => run('cancelar')}>Cancelar assinatura</button>
          </div>
        </div>
      ) : (
        <button type="button" className="tf-btn tf-btn--return" onClick={() => setConfirming(true)}>Cancelar assinatura</button>
      ))}
      {error && <p role="alert" className="ad-error">{error}</p>}
    </div>
  );
}
