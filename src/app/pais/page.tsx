"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Undo2, Copy } from 'lucide-react';
import TfIcon from '@/components/TfIcon';

// Tarefas com aprovar/devolver em andamento: um segundo toque (ou clique) não manda de novo.
const inFlight = new Set<string>();

export default function ParentsDashboard() {
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [today, setToday] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totemUrl, setTotemUrl] = useState('');
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetch('/api/pais/family')
      .then((r) => (r.ok ? r.json() : null))
      .then((f) => {
        if (!f) return;
        setTotemUrl(`${window.location.origin}/totem?c=${f.totemCode}`);
        setTrialDaysLeft(f.trialDaysLeft ?? null);
      });
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
      const list = await res.json();
      setPendingTasks(list);
      window.dispatchEvent(new CustomEvent('tf-pending', { detail: list.length }));
    } else {
      console.error('Erro ao buscar tarefas:', res.status);
    }
    if (todayRes.ok) setToday(await todayRes.json());
    if (!silent) setLoading(false);
  }

  async function handleApprove(instanceId: string) {
    if (inFlight.has(instanceId)) return;
    inFlight.add(instanceId);
    const res = await fetch(`/api/pais/instances/${instanceId}/approve`, { method: 'POST' }).catch(() => null);
    // 409: já foi tratada (outro toque ou outro aparelho). Só atualiza a lista.
    if (!res || (!res.ok && res.status !== 409)) alert('Erro ao aprovar tarefa');
    await fetchPendingTasks();
    inFlight.delete(instanceId);
  }

  async function handleReject(instanceId: string) {
    if (inFlight.has(instanceId)) return;
    inFlight.add(instanceId);
    const res = await fetch(`/api/pais/instances/${instanceId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    }).catch(() => null);
    if (!res || (!res.ok && res.status !== 409)) alert('Erro ao devolver tarefa');
    setRejectingId(null);
    setNote('');
    await fetchPendingTasks();
    inFlight.delete(instanceId);
  }

  if (loading && pendingTasks.length === 0) {
    return <div className="p-10 text-center text-ink-muted">Carregando fila de aprovação...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 md:gap-8">
      <div className="order-1 flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="font-display text-[28px] leading-[34px] md:text-3xl font-semibold text-ink">Fila de aprovação</h1>
        <div className="bg-waiting-bg text-waiting-fg px-3 py-1.5 md:px-4 md:py-2 rounded-full font-extrabold text-sm border border-waiting-border">
          {pendingTasks.length === 0 ? 'Nada pendente' : `${pendingTasks.length} aguardando você`}
        </div>
      </div>

      {trialDaysLeft !== null && (
        <div className="order-1 md:order-1 tf-card !bg-sun-soft !py-3 !px-5 font-extrabold text-[15px] text-ink">
          {trialDaysLeft > 0
            ? `Teste grátis: ${trialDaysLeft} ${trialDaysLeft === 1 ? 'dia restante' : 'dias restantes'} dos 30 dias.`
            : 'Seu teste grátis de 30 dias terminou.'}
        </div>
      )}

      {totemUrl && (
        <div className="order-4 md:order-2 tf-card flex items-center gap-3 !bg-sun-soft !py-3 !pr-3 !pl-5">
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-[15px] leading-5 text-ink">Link do totem</p>
            <p className="text-[13px] leading-[18px] text-ink-muted truncate">{totemUrl}</p>
          </div>
          <button
            onClick={copyTotemUrl}
            className="tf-btn tf-btn--primary !text-[15px] !px-[18px]"
          >
            <Copy size={18} />
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      )}

      {today.length > 0 && (
        <section className="order-3 flex flex-col gap-3 md:gap-4">
          <h2 className="font-display text-[22px] leading-7 md:text-2xl font-semibold text-ink">Tarefas de hoje</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
            {Object.values(
              today.reduce((acc: Record<string, { child: any; items: any[] }>, t) => {
                (acc[t.child.id] ||= { child: t.child, items: [] }).items.push(t);
                return acc;
              }, {}),
            ).map(({ child, items }) => (
              <article key={child.id} className="tf-card flex flex-col gap-1 md:gap-3 !py-4 !px-5">
                <h3 className="font-extrabold text-ink flex items-center justify-between gap-2 min-h-8">
                  <Link href={`/pais/criancas/${child.id}`} className="flex items-center gap-2 underline decoration-dotted underline-offset-4">
                    <TfIcon name={child.avatar} size={28} color={child.color} /> {child.name}
                  </Link>
                  <span className="text-sm font-bold text-ink-muted">
                    {items.filter((i) => i.status === 'approved').length}/{items.length} feitas
                  </span>
                </h3>
                <ul className="flex flex-col">
                  {items.map((i) => (
                    <li key={i.id} className="flex items-center gap-3 min-h-[52px] py-1.5 border-t border-line">
                      <TfIcon name={i.tasks.icon} size={28} />
                      <span className="flex-1 min-w-0 flex flex-col items-start gap-0.5">
                        <span className={`font-bold text-base leading-5 ${i.status === 'approved' ? 'line-through text-ink-muted' : 'text-ink'}`}>
                          {i.tasks.title}
                        </span>
                        <span className="flex items-center gap-2 max-w-full">
                      <span
                        className={`text-xs leading-4 font-extrabold px-2.5 py-0.5 rounded-full border shrink-0 ${
                          i.status === 'approved'
                            ? 'bg-approved-bg text-approved-fg border-approved-solid'
                            : i.status === 'awaiting_approval'
                              ? 'bg-waiting-bg text-waiting-fg border-waiting-border'
                              : 'bg-pending-bg text-pending-fg border-pending-border'
                        }`}
                      >
                        {i.status === 'approved' ? 'Aprovada' : i.status === 'awaiting_approval' ? 'Aguardando você' : 'A fazer'}
                      </span>
                          {i.status === 'pending' && i.parent_note && (
                            <span className="text-xs text-returned-fg truncate">Devolvida: {i.parent_note}</span>
                          )}
                        </span>
                      </span>
                      <span className="text-sm font-bold text-ink-muted whitespace-nowrap">{i.tasks.points}<TfIcon name="estrela" size={20} className="ml-1" /></span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}

      {pendingTasks.length === 0 ? (
        <div className="order-2 md:order-4 bg-surface-raised px-5 py-8 md:p-12 rounded-[24px] md:rounded-[32px] border-2 border-dashed border-line text-center space-y-4">
          <div className="flex justify-center text-line-strong">
            <Check size={64} />
          </div>
          <p className="text-lg md:text-xl text-ink-muted font-bold md:font-medium">Tudo em dia! Não há tarefas aguardando aprovação.</p>
        </div>
      ) : (
        <div className="order-2 md:order-4 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {pendingTasks.map((instance) => (
            <article key={instance.id} className="tf-card flex flex-col gap-4 !p-5 md:!p-4">
              <div className="flex items-start md:items-center gap-3.5 md:gap-4">
                <span className="tf-task__icon"><TfIcon name={instance.tasks.icon} size={40} /></span>
                <div className="flex-1 min-w-0 flex flex-col gap-1.5 md:gap-0">
                  <div className="flex items-start justify-between gap-2 md:contents">
                  <h3 className="tf-task__title text-pretty">{instance.tasks.title}</h3>
                  <span className="tf-task__pts md:hidden !text-base !px-2.5 !py-1.5">+{instance.tasks.points}<TfIcon name="estrela" size={20} className="ml-1" /></span>
                  </div>
                  <p className="text-sm text-ink-muted flex flex-wrap items-center gap-2">
                    <span
                      className="tf-child tf-child--sm"
                      style={{ '--kid': instance.children.color, '--kid-soft': `color-mix(in srgb, ${instance.children.color} 14%, var(--surface-raised))` } as React.CSSProperties}
                    >
                      <span className="tf-child__avatar" style={{ ['--size' as string]: '24px', borderWidth: 2 }}><TfIcon name={instance.children.avatar} size={16} flat color={instance.children.color} /></span>
                    </span>
                    <span className="font-bold text-ink">{instance.children.name}</span>
                    <span>hoje, {new Date(instance.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </p>
                </div>
                <span className="tf-task__pts hidden md:inline-block">+{instance.tasks.points}<TfIcon name="estrela" size={20} className="ml-1" /></span>
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
                    className="min-h-[52px] md:min-h-12 px-5 rounded-full border-2 border-line-strong bg-surface-raised text-ink"
                  />
                </label>
              )}

              <div className="grid grid-cols-2 gap-3">
                {rejectingId === instance.id ? (
                  <>
                    <button onClick={() => { setRejectingId(null); setNote(''); }} className="tf-btn tf-btn--secondary !min-h-[52px] md:!min-h-12 !px-3">Cancelar</button>
                    <button onClick={() => handleReject(instance.id)} className="tf-btn tf-btn--return !min-h-[52px] md:!min-h-12 !px-3"><Undo2 className="tf-icon" /> Devolver</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleApprove(instance.id)} className="tf-btn tf-btn--approve order-2 md:order-1 !min-h-[52px] md:!min-h-12 !px-3"><Check className="tf-icon" /> Aprovar</button>
                    <button onClick={() => { setRejectingId(instance.id); setNote(''); }} className="tf-btn tf-btn--return order-1 md:order-2 !min-h-[52px] md:!min-h-12 !px-3"><Undo2 className="tf-icon" /> Devolver</button>
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
