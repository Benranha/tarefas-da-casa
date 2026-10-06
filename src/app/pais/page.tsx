"use client";
import React, { useEffect, useState } from 'react';
import { Check, Undo2, Copy } from 'lucide-react';

export default function ParentsDashboard() {
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totemUrl, setTotemUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetch('/api/pais/family')
      .then((r) => (r.ok ? r.json() : null))
      .then((f) => f && setTotemUrl(`${window.location.origin}/totem?c=${f.totemCode}`));
  }, []);

  async function copyTotemUrl() {
    await navigator.clipboard.writeText(totemUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    fetchPendingTasks();
    // Sem Realtime no Neon: atualiza a fila a cada 10s.
    const timer = setInterval(() => fetchPendingTasks(true), 10000);
    return () => clearInterval(timer);
  }, []);

  async function fetchPendingTasks(silent = false) {
    if (!silent) setLoading(true);
    const res = await fetch('/api/pais/pending', { cache: 'no-store' });
    if (res.ok) {
      setPendingTasks(await res.json());
    } else {
      console.error('Erro ao buscar tarefas:', res.status);
    }
    if (!silent) setLoading(false);
  }

  async function handleApprove(instanceId: string) {
    const res = await fetch(`/api/pais/instances/${instanceId}/approve`, { method: 'POST' });
    if (!res.ok) {
      alert('Erro ao aprovar tarefa');
    }
    await fetchPendingTasks();
  }

  async function handleReject(instanceId: string) {
    const res = await fetch(`/api/pais/instances/${instanceId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    });
    if (!res.ok) {
      alert('Erro ao devolver tarefa');
    }
    setRejectingId(null);
    setNote('');
    await fetchPendingTasks();
  }

  if (loading && pendingTasks.length === 0) {
    return <div className="p-10 text-center text-ink-muted">Carregando fila de aprovação...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-ink">Fila de aprovação</h1>
        <div className="bg-waiting-bg text-waiting-fg px-4 py-2 rounded-full font-bold text-sm border border-waiting-border">
          {pendingTasks.length} tarefas pendentes
        </div>
      </div>

      {totemUrl && (
        <div className="tf-card flex flex-col md:flex-row md:items-center gap-3 !bg-sun-soft">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-ink">Link do totem (tablet das crianças)</p>
            <p className="text-sm text-ink-muted truncate">{totemUrl}</p>
          </div>
          <button
            onClick={copyTotemUrl}
            className="tf-btn tf-btn--primary"
          >
            <Copy size={18} />
            {copied ? 'Copiado!' : 'Copiar link'}
          </button>
        </div>
      )}

      {pendingTasks.length === 0 ? (
        <div className="bg-surface-raised p-12 rounded-[32px] border-2 border-dashed border-line text-center space-y-4">
          <div className="flex justify-center text-line-strong">
            <Check size={64} />
          </div>
          <p className="text-xl text-ink-muted font-medium">Tudo em dia! Não há tarefas aguardando aprovação.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pendingTasks.map((instance) => (
            <article key={instance.id} className="tf-card flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <span className="tf-task__icon">{instance.tasks.icon || '✨'}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="tf-task__title">{instance.tasks.title}</h3>
                  <p className="text-sm text-ink-muted flex items-center gap-2">
                    <span
                      className="tf-child tf-child--sm"
                      style={{ '--kid': instance.children.color, '--kid-soft': `color-mix(in srgb, ${instance.children.color} 14%, var(--surface-raised))` } as React.CSSProperties}
                    >
                      <span className="tf-child__avatar" style={{ ['--size' as string]: '24px', borderWidth: 2, fontSize: 13 }}>{instance.children.avatar}</span>
                    </span>
                    <span className="font-bold text-ink">{instance.children.name}</span>
                    <span>• hoje, {new Date(instance.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </p>
                </div>
                <span className="tf-task__pts">+{instance.tasks.points} ⭐</span>
              </div>

              {rejectingId === instance.id && (
                <label className="flex flex-col gap-2">
                  <span className="font-extrabold text-ink">Recado para {instance.children.name} (opcional)</span>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={140}
                    autoFocus
                    placeholder="Ex.: falta a língua!"
                    className="min-h-12 px-5 rounded-full border-2 border-line-strong bg-surface-raised text-ink"
                  />
                </label>
              )}

              <div className="grid grid-cols-2 gap-3">
                {rejectingId === instance.id ? (
                  <>
                    <button onClick={() => { setRejectingId(null); setNote(''); }} className="tf-btn tf-btn--secondary">Cancelar</button>
                    <button onClick={() => handleReject(instance.id)} className="tf-btn tf-btn--return"><Undo2 className="tf-icon" /> Devolver</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleApprove(instance.id)} className="tf-btn tf-btn--approve"><Check className="tf-icon" /> Aprovar</button>
                    <button onClick={() => { setRejectingId(instance.id); setNote(''); }} className="tf-btn tf-btn--return"><Undo2 className="tf-icon" /> Devolver</button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
