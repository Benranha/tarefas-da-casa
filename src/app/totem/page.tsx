"use client";
import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Check, Circle, Clock, ArrowLeft, Star, Gift } from 'lucide-react';
import Link from 'next/link';

export default function TotemPage() {
  const [step, setStep] = useState<'selection' | 'tasks' | 'rewards'>('selection');
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<any[]>([]);
  const [code, setCode] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [rewards, setRewards] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<{ points: number } | null>(null);
  const prevStatus = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if ('wakeLock' in navigator) {
      requestWakeLock();
    }
  }, []);

  async function requestWakeLock() {
    try {
      await (navigator as any).wakeLock.request('screen');
    } catch (err) {
      console.error(`Wake Lock erro: ${err}`);
    }
  }

  // O link do totem traz ?c=CÓDIGO. Guardamos no aparelho para o app instalado (PWA) abrir direto.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('c');
    let c = fromUrl;
    try {
      if (fromUrl) localStorage.setItem('totemCode', fromUrl);
      else c = localStorage.getItem('totemCode');
    } catch {}
    if (!c) {
      setInvalid(true);
      return;
    }
    setCode(c);
    fetch(`/api/totem/children?code=${c}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setChildren(Array.isArray(data) ? data : []))
      .catch(() => setInvalid(true));
  }, []);

  // Momento de conquista: acontece quando os pais aprovam (carimbo, selo de pontos e confete).
  function celebrate(points: number) {
    confetti({
      particleCount: 120,
      spread: 75,
      origin: { y: 0.55 },
      disableForReducedMotion: true,
      colors: [selectedChild?.color || '#C0430E', '#15803D', '#FFC93C', '#2F5BEA', '#C8266B'],
    });
    setCelebration({ points });
    setTimeout(() => setCelebration(null), 2800);
  }

  async function fetchTasks(childId: string, silent = false) {
    if (!silent) setLoading(true);
    const res = await fetch(`/api/totem/tasks?code=${code}&childId=${childId}`, { cache: 'no-store' });
    const data = res.ok ? await res.json() : [];
    for (const t of data) {
      if (prevStatus.current.get(t.id) === 'awaiting_approval' && t.status === 'approved') celebrate(t.tasks?.points ?? 0);
    }
    prevStatus.current = new Map(data.map((t: any) => [t.id, t.status]));
    setTasks(data);
    if (!silent) setLoading(false);
  }

  // Sem Realtime no Neon: atualiza a lista a cada 5s enquanto a criança está na tela.
  useEffect(() => {
    if (!selectedChild) return;
    const timer = setInterval(() => {
      fetchTasks(selectedChild.id, true);
      refreshPoints(selectedChild.id);
    }, 5000);
    return () => clearInterval(timer);
  }, [selectedChild]);

  async function refreshPoints(childId: string) {
    const res = await fetch(`/api/totem/children?code=${code}`, { cache: 'no-store' });
    if (!res.ok) return;
    const list = await res.json();
    setChildren(list);
    const me = list.find((c: any) => c.id === childId);
    if (me) setSelectedChild((cur: any) => (cur && cur.points !== me.points ? { ...cur, points: me.points } : cur));
  }

  async function openRewards() {
    setMessage(null);
    const res = await fetch(`/api/totem/rewards?code=${code}`, { cache: 'no-store' });
    setRewards(res.ok ? await res.json() : []);
    setStep('rewards');
  }

  async function redeem(reward: any) {
    const res = await fetch(`/api/totem/rewards/${reward.id}/redeem?code=${code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId: selectedChild.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setSelectedChild({ ...selectedChild, points: data.points });
      setMessage(`Pedido enviado: ${reward.title}! Avise os papais 🎉`);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, disableForReducedMotion: true });
    } else {
      setMessage('Você ainda não tem pontos suficientes.');
    }
  }

  async function handleChildSelect(child: any) {
    setSelectedChild(child);
    setStep('tasks');
    await fetchTasks(child.id);
  }

  async function markTaskDone(instanceId: string) {
    const res = await fetch(`/api/totem/tasks/${instanceId}/done?code=${code}`, { method: 'POST' });

    if (res.ok) {
      await fetchTasks(selectedChild.id);
    }
  }

  const kidStyle = (c: any) =>
    ({
      '--kid': c.color,
      '--kid-soft': `color-mix(in srgb, ${c.color} 14%, var(--surface-raised))`,
    }) as React.CSSProperties;

  if (invalid) {
    return (
      <div className="tf-totem min-h-screen flex flex-col items-center justify-center gap-6 p-8">
        <p className="text-2xl text-center text-ink max-w-lg">
          Link do totem inválido. Abra o painel dos pais e copie o link do totem em &quot;Dashboard&quot;.
        </p>
        <Link href="/abrir?trocar=1" className="text-xl font-bold text-brand underline">
          Configurar este aparelho
        </Link>
      </div>
    );
  }

  if (step === 'selection') {
    return (
      <div className="tf-totem min-h-screen flex flex-col p-8">
        <header className="flex justify-between items-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/tarefinha-horizontal-claro.svg" alt="Tarefinha" className="h-16" />
          <Link href="/abrir?trocar=1" className="text-sm text-ink-muted hover:text-brand">
            Trocar modo
          </Link>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-16">
          <h1 className="font-display text-5xl font-semibold text-ink text-center">
            Quem está fazendo as tarefas hoje?
          </h1>
          {children.length === 0 && (
            <p className="text-xl text-ink-muted text-center -mt-8">
              Nenhuma criança cadastrada ainda. Peça aos pais para cadastrar no painel.
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-16 max-w-5xl w-full">
            {children.map((child) => (
              <button key={child.id} onClick={() => handleChildSelect(child)} className="tf-child" style={kidStyle(child)}>
                <span className="tf-child__avatar" style={{ ['--size' as string]: '180px' }}>{child.avatar}</span>
                {child.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'rewards') {
    return (
      <div className="tf-totem min-h-screen flex flex-col" style={kidStyle(selectedChild)}>
        <header className="flex justify-between items-center px-10 py-6" style={{ background: 'var(--kid-soft)' }}>
          <button onClick={() => setStep('tasks')} className="tf-btn tf-btn--totem tf-btn--secondary">
            <ArrowLeft size={28} /> Voltar
          </button>
          <div className="flex items-center gap-4">
            <div className="tf-seal"><Star size={44} className="fill-current" /></div>
            <div>
              <div className="tf-points__value">{selectedChild.points || 0}</div>
              <div className="tf-points__unit">pontos</div>
            </div>
          </div>
        </header>
        <main className="flex-1 px-10 py-8">
          <h2 className="font-display text-4xl font-semibold text-ink mb-6">Recompensas</h2>
          {message && <p className="text-2xl font-bold text-ink mb-6">{message}</p>}
          {rewards.length === 0 ? (
            <p className="text-2xl text-ink-muted">Os papais ainda não cadastraram recompensas.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
              {rewards.map((r) => {
                const can = (selectedChild.points || 0) >= r.cost_points;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => redeem(r)}
                    disabled={!can}
                    className={`tf-task ${can ? 'tf-task--waiting' : ''} disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    <span className="tf-task__row">
                      <span className="tf-task__icon">{r.icon || '🎁'}</span>
                      <span className="tf-task__pts">{r.cost_points} ⭐</span>
                    </span>
                    <span>
                      <p className="tf-task__title">{r.title}</p>
                      <span className="tf-task__status">
                        {can ? 'Toque para pedir' : `Faltam ${r.cost_points - (selectedChild.points || 0)} pts`}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </main>
      </div>
    );
  }

  const approvedCount = tasks.filter((t) => t.status === 'approved').length;

  return (
    <div className="tf-totem min-h-screen flex flex-col" style={kidStyle(selectedChild)}>
      <header className="flex justify-between items-center px-10 py-6" style={{ background: 'var(--kid-soft)' }}>
        <div className="flex items-center gap-6">
          <span className="tf-child__avatar" style={{ ['--size' as string]: '96px', boxShadow: 'none', background: 'var(--surface-raised)' }}>
            {selectedChild.avatar}
          </span>
          <div>
            <p className="font-display text-4xl font-semibold text-ink">Oi, {selectedChild.name}!</p>
            <p className="text-xl font-bold text-ink-muted">Minhas tarefas de hoje</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="tf-seal"><Star size={44} className="fill-current" /></div>
          <div>
            <div className="tf-points__value">{selectedChild.points || 0}</div>
            <div className="tf-points__unit">pontos</div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-10 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {tasks.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <p className="font-display text-3xl text-ink-muted">Tudo limpo por aqui! 🎉</p>
              </div>
            ) : (
              tasks.map((instance) => {
                const st = instance.status;
                return (
                  <button
                    key={instance.id}
                    type="button"
                    className={`tf-task ${st === 'approved' ? 'tf-task--approved' : st === 'awaiting_approval' ? 'tf-task--waiting' : ''}`}
                    onClick={() => st === 'pending' && markTaskDone(instance.id)}
                  >
                    <span className="tf-task__row">
                      <span className="tf-task__icon">{instance.tasks.icon || '✨'}</span>
                      <span className="tf-task__pts">+{instance.tasks.points} ⭐</span>
                    </span>
                    <span>
                      <p className="tf-task__title">{instance.tasks.title}</p>
                      <span className="tf-task__status">
                        {st === 'approved' && (<><Check className="tf-icon" /> Aprovado!</>)}
                        {st === 'awaiting_approval' && (<><Clock className="tf-icon" /> Aguardando papais...</>)}
                        {st === 'pending' && (<><Circle className="tf-icon" /> Toque quando terminar</>)}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </main>

      <footer className="flex items-center justify-between px-10 pb-8">
        <span className="text-xl font-bold text-ink-muted">{approvedCount} de {tasks.length} aprovadas</span>
        <div className="flex gap-4">
          <button onClick={openRewards} className="tf-btn tf-btn--totem tf-btn--primary">
            <Gift size={28} /> Prêmios
          </button>
          <button onClick={() => setStep('selection')} className="tf-btn tf-btn--totem tf-btn--secondary">
            <ArrowLeft size={28} /> Trocar de criança
          </button>
        </div>
      </footer>

      {celebration && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 pointer-events-none" aria-live="polite">
          <span className="tf-stamp"><Check size={40} /> Aprovado!</span>
          <div className="tf-seal tf-seal--pop" style={{ width: 128, height: 128, fontSize: 44 }}>+{celebration.points}</div>
        </div>
      )}
    </div>
  );
}
