"use client";
import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Check, Circle, Clock, ArrowLeft, Gift, Undo2, AlarmClock, Moon } from 'lucide-react';
import Link from 'next/link';
import PinForm from '@/components/PinForm';
import TfIcon from '@/components/TfIcon';

export default function TotemPage() {
  const [step, setStep] = useState<'selection' | 'pin' | 'tasks' | 'rewards'>('selection');
  // Código da criança que está usando o totem agora: vale só para ela e some ao trocar de criança.
  const [token, setToken] = useState<string | null>(null);
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

  // Na seleção de criança, mantém as contagens de tarefas atualizadas.
  useEffect(() => {
    if (step !== 'selection' || !code) return;
    const refresh = () =>
      fetch(`/api/totem/children?code=${code}`, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => Array.isArray(data) && setChildren(data))
        .catch(() => {});
    refresh(); // ao voltar da lista de tarefas, atualiza já
    const timer = setInterval(refresh, 8000);
    return () => clearInterval(timer);
  }, [step, code]);

  // "Trocar modo" é dos pais: se houver código parental, pede antes de abrir a reconfiguração.
  const [parentalOpen, setParentalOpen] = useState(false);

  function goSwitchMode(token: string) {
    window.location.href = `/abrir?trocar=1&p=${encodeURIComponent(token)}`;
  }

  async function requestSwitchMode() {
    const res = await fetch(`/api/totem/parental?code=${code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '' }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.required === false) return goSwitchMode(data.token);
    setParentalOpen(true);
  }

  async function submitParental(pin: string): Promise<string | null> {
    const res = await fetch(`/api/totem/parental?code=${code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data.error || 'Não deu certo. Tente de novo.';
    goSwitchMode(data.token);
    return null;
  }

  const auth = (): Record<string, string> => (token ? { 'x-child-token': token } : {});

  // Token vencido ou código redefinido pelos pais: volta para a escolha de criança.
  function leaveChild() {
    setToken(null);
    setSelectedChild(null);
    setStep('selection');
  }

  async function fetchTasks(childId: string, silent = false) {
    if (!silent) setLoading(true);
    const res = await fetch(`/api/totem/tasks?code=${code}`, { cache: 'no-store', headers: auth() });
    if (res.status === 401) return leaveChild();
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
    if (!selectedChild || !token) return;
    const timer = setInterval(() => {
      fetchTasks(selectedChild.id, true);
      refreshPoints(selectedChild.id);
    }, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChild, token]);

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
      headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ childId: selectedChild.id }),
    });
    if (res.status === 401) return leaveChild();
    if (res.ok) {
      const data = await res.json();
      setSelectedChild({ ...selectedChild, points: data.points });
      setMessage(`Pedido enviado: ${reward.title}! Avise os papais!`);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, disableForReducedMotion: true });
    } else {
      setMessage('Você ainda não tem pontos suficientes.');
    }
  }

  // Antes de ver as tarefas, a criança digita o código dela (ou cria, na primeira vez).
  function handleChildSelect(child: any) {
    setSelectedChild(child);
    setToken(null);
    setStep('pin');
  }

  async function submitPin(pin: string): Promise<string | null> {
    const res = await fetch(`/api/totem/pin?code=${code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId: selectedChild.id, pin }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 409) setSelectedChild({ ...selectedChild, has_pin: true });
      return data.error || 'Não deu certo. Tente de novo.';
    }
    setToken(data.token);
    setSelectedChild((c: any) => ({ ...c, has_pin: true }));
    setStep('tasks');
    // O token ainda não está no estado neste instante: busca as tarefas já com ele.
    setLoading(true);
    const r = await fetch(`/api/totem/tasks?code=${code}`, { cache: 'no-store', headers: { 'x-child-token': data.token } });
    const list = r.ok ? await r.json() : [];
    prevStatus.current = new Map(list.map((t: any) => [t.id, t.status]));
    setTasks(list);
    setLoading(false);
    return null;
  }

  async function markTaskDone(instanceId: string) {
    const res = await fetch(`/api/totem/tasks/${instanceId}/done?code=${code}`, { method: 'POST', headers: auth() });
    if (res.status === 401) return leaveChild();

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
        {parentalOpen && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 p-8 bg-surface">
            <h2 className="font-display text-3xl font-semibold text-ink text-center">Só para os papais</h2>
            <PinForm creating={false} onSubmit={submitParental} big label="Código parental" submitLabel="Abrir" />
            <button onClick={() => setParentalOpen(false)} className="tf-btn tf-btn--secondary">
              <ArrowLeft className="tf-icon" /> Voltar
            </button>
          </div>
        )}
        <header className="flex justify-between items-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/tarefinha-horizontal-claro.svg" alt="Tarefinha" className="h-16" />
          <button onClick={requestSwitchMode} className="text-sm text-ink-muted hover:text-brand">
            Trocar modo
          </button>
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
                <span className="tf-child__avatar" style={{ ['--size' as string]: '180px' }}><TfIcon name={child.avatar} size={118} color={child.color} /></span>
                {child.name}
                <span
                  className={`text-xl font-extrabold px-4 py-1 rounded-full border-2 ${
                    child.todo_count > 0
                      ? 'bg-waiting-bg text-waiting-fg border-waiting-border'
                      : child.tasks_today > 0
                        ? 'bg-approved-bg text-approved-fg border-approved-solid'
                        : 'bg-pending-bg text-pending-fg border-pending-border'
                  }`}
                >
                  {child.todo_count > 0
                    ? `${child.todo_count} ${child.todo_count === 1 ? 'tarefa' : 'tarefas'} para fazer`
                    : child.tasks_today > 0
                      ? <>Tudo feito! <TfIcon name="festa" size="1.2em" /></>
                      : 'Sem tarefas hoje'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'pin' && selectedChild) {
    return (
      <div className="tf-totem min-h-screen flex flex-col items-center justify-center gap-8 p-8" style={kidStyle(selectedChild)}>
        <span className="tf-child__avatar" style={{ ['--size' as string]: '140px' }}><TfIcon name={selectedChild.avatar} size={91} color={selectedChild.color} /></span>
        <h1 className="font-display text-4xl font-semibold text-ink text-center">Oi, {selectedChild.name}!</h1>
        <PinForm key={selectedChild.id + String(selectedChild.has_pin)} creating={!selectedChild.has_pin} onSubmit={submitPin} big />
        <button onClick={leaveChild} className="tf-btn tf-btn--secondary">
          <ArrowLeft className="tf-icon" /> Não sou eu
        </button>
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
            <div className="tf-seal"><TfIcon name="estrela" size={46} flat style={{ ['--ic-star' as string]: '#fff8ef' }} /></div>
            <div>
              <div className="tf-points__value">{selectedChild.points || 0}</div>
              <div className="tf-points__unit">pontos</div>
            </div>
          </div>
        </header>
        <main className="flex-1 px-10 py-8">
          <h2 className="font-display text-4xl font-semibold text-ink mb-6">Recompensas</h2>
          {message && (
            <p className="text-2xl font-bold text-ink mb-6">
              {message}
              {message.startsWith('Pedido enviado') && <> <TfIcon name="festa" size="1.2em" /></>}
            </p>
          )}
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
                      <span className="tf-task__icon"><TfIcon name={r.icon || 'presente'} size={66} /></span>
                      <span className="tf-task__pts">{r.cost_points}<TfIcon name="estrela" size={26} className="ml-1" /></span>
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
            <TfIcon name={selectedChild.avatar} size={62} color={selectedChild.color} />
          </span>
          <div>
            <p className="font-display text-4xl font-semibold text-ink">Oi, {selectedChild.name}!</p>
            <p className="text-xl font-bold text-ink-muted">Minhas tarefas de hoje</p>
            {selectedChild.bed_time && (
              <p className="text-lg font-bold text-ink-muted flex items-center gap-2">
                <Moon className="tf-icon" /> Hora de dormir: {selectedChild.bed_time}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="tf-seal"><TfIcon name="estrela" size={46} flat style={{ ['--ic-star' as string]: '#fff8ef' }} /></div>
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
                <p className="font-display text-3xl text-ink-muted">Tudo limpo por aqui! <TfIcon name="festa" size="1.2em" /></p>
              </div>
            ) : (
              tasks.map((instance) => {
                const st = instance.status;
                // Devolvida pelos pais: volta a "pending" com o recado em parent_note.
                const returned = st === 'pending' && Boolean(instance.parent_note);
                return (
                  <button
                    key={instance.id}
                    type="button"
                    className={`tf-task ${st === 'approved' ? 'tf-task--approved' : st === 'awaiting_approval' ? 'tf-task--waiting' : returned ? 'tf-task--returned' : ''}`}
                    onClick={() => st === 'pending' && markTaskDone(instance.id)}
                  >
                    <span className="tf-task__row">
                      <span className="tf-task__icon"><TfIcon name={instance.tasks.icon} size={66} /></span>
                      <span className="tf-task__pts">+{instance.tasks.points}<TfIcon name="estrela" size={26} className="ml-1" /></span>
                    </span>
                    <span>
                      <p className="tf-task__title">{instance.tasks.title}</p>
                      {instance.tasks.due_time && (
                        <span className="tf-task__status"><AlarmClock className="tf-icon" /> Às {instance.tasks.due_time}</span>
                      )}
                      {instance.tasks.description && <p className="text-lg text-ink-muted mt-1">{instance.tasks.description}</p>}
                      <span className="tf-task__status">
                        {st === 'approved' && (<><Check className="tf-icon" /> Aprovado!</>)}
                        {st === 'awaiting_approval' && (<><Clock className="tf-icon" /> Aguardando papais...</>)}
                        {st === 'pending' && !returned && (<><Circle className="tf-icon" /> Toque quando terminar</>)}
                        {returned && (<><Undo2 className="tf-icon" /> Os papais devolveram. Toque quando refizer</>)}
                      </span>
                      {returned && <span className="tf-task__note"><TfIcon name="recado" size={30} color="var(--returned-border)" className="mr-2" /> Papais: {instance.parent_note}</span>}
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
          <button onClick={leaveChild} className="tf-btn tf-btn--totem tf-btn--secondary">
            <ArrowLeft size={28} /> Trocar de criança
          </button>
        </div>
      </footer>

      {celebration && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 pointer-events-none" aria-live="polite">
          <span className="tf-stamp"><TfIcon name="festa" size={40} color="var(--approved-solid)" /> Aprovado!</span>
          <div className="tf-seal tf-seal--pop" style={{ width: 128, height: 128, fontSize: 44 }}>+{celebration.points}</div>
        </div>
      )}
    </div>
  );
}
