"use client";
import React, { useEffect, useState } from 'react';
import { colors, Typography } from '@/styles/theme';
import confetti from 'canvas-confetti';
import { CheckCircle2, Clock, ArrowLeft, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TotemPage() {
  const [step, setStep] = useState<'selection' | 'tasks'>('selection');
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<any[]>([]);
  const [code, setCode] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const router = useRouter();

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

  async function fetchTasks(childId: string, silent = false) {
    if (!silent) setLoading(true);
    const res = await fetch(`/api/totem/tasks?code=${code}&childId=${childId}`, { cache: 'no-store' });
    const data = res.ok ? await res.json() : [];
    setTasks(data);
    if (!silent) setLoading(false);
  }

  // Sem Realtime no Neon: atualiza a lista a cada 5s enquanto a criança está na tela.
  useEffect(() => {
    if (!selectedChild) return;
    const timer = setInterval(() => fetchTasks(selectedChild.id, true), 5000);
    return () => clearInterval(timer);
  }, [selectedChild]);

  async function handleChildSelect(child: any) {
    setSelectedChild(child);
    setStep('tasks');
    await fetchTasks(child.id);
  }

  async function markTaskDone(instanceId: string) {
    const res = await fetch(`/api/totem/tasks/${instanceId}/done?code=${code}`, { method: 'POST' });

    if (res.ok) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: [selectedChild.color || '#C0430E', '#15803D', '#FFC93C']
      });
      await fetchTasks(selectedChild.id);
    }
  }

  if (invalid) {
    return (
      <div className={`min-h-screen ${colors.background} flex items-center justify-center p-8`}>
        <p className="text-2xl text-center text-ink max-w-lg">
          Link do totem inválido. Abra o painel dos pais e copie o link do totem em &quot;Dashboard&quot;.
        </p>
      </div>
    );
  }

  if (step === 'selection') {
    return (
      <div className={`min-h-screen ${colors.background} flex flex-col items-center justify-center p-8`}>
        <h1 className={`text-5xl font-bold text-ink mb-16 text-center ${Typography.h1}`}>
          Quem está fazendo as tarefas hoje?
        </h1>

        {children.length === 0 && (
          <p className="text-xl text-ink-muted text-center -mt-8 mb-8">
            Nenhuma criança cadastrada ainda. Peça aos pais para cadastrar no painel.
          </p>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12 max-w-5xl w-full">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => handleChildSelect(child)}
              className="group flex flex-col items-center gap-6 transition-transform active:scale-95"
            >
              <div
                className="w-40 h-40 rounded-full bg-surface-raised border-8 border-surface-raised shadow-xl flex items-center justify-center text-8xl transition-all group-hover:shadow-2xl"
                style={{ boxShadow: `0 0 0 8px ${child.color}` }}
              >
                {child.avatar}
              </div>
              <span className="text-3xl font-bold text-ink">{child.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.background} p-8 flex flex-col`}>
      <header className="flex justify-between items-center mb-10">
        <button
          onClick={() => setStep('selection')}
          className="flex items-center gap-2 text-ink-muted font-bold text-xl hover:text-ink transition-colors"
        >
          <ArrowLeft size={24} />
            Trocar Criança
        </button>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-surface-raised px-6 py-3 rounded-full shadow-sm border-2 border-line">
            <span className="text-4xl">{selectedChild.avatar}</span>
            <span className="text-2xl font-bold text-ink">{selectedChild.name}</span>
          </div>
          <div className="flex items-center gap-2 bg-waiting-bg px-6 py-3 rounded-full shadow-sm border-2 border-waiting-border">
            <Star className="text-waiting-fg fill-waiting-fg" size={24} />
            <span className="text-2xl font-bold text-waiting-fg">{selectedChild.points || 0} pts</span>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-4xl font-bold text-ink">Minhas Tarefas de Hoje</h2>
          <div className="text-xl font-medium text-ink-muted">
            {tasks.filter(t => t.status === 'approved').length} de {tasks.length} completas
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <p className="text-3xl text-ink-muted font-medium">Tudo limpo por aqui! 🎉</p>
              </div>
            ) : (
              tasks.map((instance) => (
                <div
                  key={instance.id}
                  className={`p-6 rounded-[32px] border-4 transition-all flex items-center gap-6 cursor-pointer active:scale-95 ${
                    instance.status === 'approved'
                      ? 'bg-approved-bg border-approved-solid opacity-80'
                      : instance.status === 'awaiting_approval'
                      ? 'bg-waiting-bg border-waiting-border'
                      : 'bg-surface-raised border-line shadow-sm'
                  }`}
                  onClick={() => instance.status === 'pending' && markTaskDone(instance.id)}
                >
                  <div className="text-5xl bg-surface-raised p-4 rounded-2xl shadow-sm">
                    {instance.tasks.icon || '✨'}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-2xl font-bold ${instance.status === 'approved' ? 'text-approved-fg line-through' : 'text-ink'}`}>
                      {instance.tasks.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {instance.status === 'approved' && (
                        <span className="flex items-center gap-1 text-approved-fg font-bold text-sm">
                        <CheckCircle2 size={16} /> Aprovado!
                        </span>
                      )}
                      {instance.status === 'awaiting_approval' && (
                        <span className="flex items-center gap-1 text-waiting-fg font-bold text-sm">
                        <Clock size={16} /> Aguardando papais...
                        </span>
                      )}
                      {instance.status === 'pending' && (
                        <span className="text-ink-muted font-medium text-sm">Tocar para concluir</span>
                      )}
                    </div>
                  </div>
                  <div className="text-2xl font-black text-ink">
                    {instance.tasks.points} pts
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
