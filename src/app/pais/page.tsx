"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Undo2, Copy } from 'lucide-react';
import TfIcon from '@/components/TfIcon';

export default function ParentsDashboard() {
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [today, setToday] = useState<any[]>([]);
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
    const [res, todayRes] = await Promise.all([
      fetch('/api/pais/pending', { cache: 'no-store' }),
      fetch('/api/pais/today', { cache: 'no-store' }),
    ]);
    if (res.ok) {
      setPendingTasks(await res.json());
    } else {
      console.error('Erro ao buscar tarefas:', res.status);
    }
    if (todayRes.ok) setToday(await todayRes.json());
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

      {today.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold text-ink">Tarefas de hoje</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.values(
              today.reduce((acc: Record<string, { child: any; items: any[] }>, t) => {
                (acc[t.child.id] ||= { child: t.child, items: [] }).items.push(t);
                return acc;
              }, {}),
            ).map(({ child, items }) => (
              <article key={child.id} className="tf-card flex flex-col gap-3">
                <h3 className="font-bold text-ink flex items-center gap-2">
                  <Link href={`/pais/criancas/${child.id}`} className="flex items-center gap-2 underline decoration-dotted underline-offset-4">
                    <TfIcon name={child.avatar} size={28} color={child.color} /> {child.name}
                  </Link>
                  <span className="text-sm font-medium text-ink-muted">
                    • {items.filter((i) => i.status === 'approved').length} de {items.length} feitas
                  </span>
                </h3>
                <ul className="flex flex-col gap-2">
                  {items.map((i) => (
                    <li key={i.id} className="flex items-center gap-3">
                      <TfIcon name={i.tasks.icon} size={28} />
                      <span className="flex-1 min-w-0">
                        <span className={`font-bold ${i.status === 'approved' ? 'line-through text-ink-muted' : 'text-ink'}`}>
                          {i.tasks.title}
                        </span>
                        {i.status === 'pending' && i.parent_note && (
                          <span className="block text-xs text-returned-fg">Devolvida: {i.parent_note}</span>
                        )}
                      </span>
                      <span className="text-sm text-ink-muted">{i.tasks.points}<TfIcon name="estrela" size={20} className="ml-1" /></span>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${
                          i.status === 'approved'
                            ? 'bg-approved-bg text-approved-fg border-approved-solid'
                            : i.status === 'awaiting_approval'
                              ? 'bg-waiting-bg text-waiting-fg border-waiting-border'
                              : 'bg-pending-bg text-pending-fg border-pending-border'
                        }`}
                      >
                        {i.status === 'approved' ? 'Aprovada' : i.status === 'awaiting_approval' ? 'Aguardando você' : 'A fazer'}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
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
                <span className="tf-task__icon"><TfIcon name={instance.tasks.icon} size={40} /></span>
                <div className="flex-1 min-w-0">
                  <h3 className="tf-task__title">{instance.tasks.title}</h3>
                  <p className="text-sm text-ink-muted flex items-center gap-2">
                    <span
                      className="tf-child tf-child--sm"
                      style={{ '--kid': instance.children.color, '--kid-soft': `color-mix(in srgb, ${instance.children.color} 14%, var(--surface-raised))` } as React.CSSProperties}
                    >
                      <span className="tf-child__avatar" style={{ ['--size' as string]: '24px', borderWidth: 2 }}><TfIcon name={instance.children.avatar} size={16} flat color={instance.children.color} /></span>
                    </span>
                    <span className="font-bold text-ink">{instance.children.name}</span>
                    <span>• hoje, {new Date(instance.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </p>
                </div>
                <span className="tf-task__pts">+{instance.tasks.points}<TfIcon name="estrela" size={20} className="ml-1" /></span>
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
