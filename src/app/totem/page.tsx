"use client";
import React, { useEffect, useState } from 'react';
import { colors, Typography } from '@/styles/theme';
import confetti from 'canvas-confetti';
import { CheckCircle2, Clock, ArrowLeft, Star, Gift } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
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
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: [selectedChild.color || '#5C4033', '#4ADE80', '#FACC15']
      });
      await fetchTasks(selectedChild.id);
    }
  }

  if (invalid) {
    return (
      <div className={`min-h-screen ${colors.background} flex items-center justify-center p-8`}>
        <p className="text-2xl text-center text-[#5C4033] max-w-lg">
          Link do totem inválido. Abra o painel dos pais e copie o link do totem em &quot;Dashboard&quot;.
        </p>
      </div>
    );
  }

  if (step === 'selection') {
    return (
      <div className={`min-h-screen ${colors.background} flex flex-col items-center justify-center p-8`}>
        <h1 className={`text-5xl font-bold text-[#5C4033] mb-16 text-center ${Typography.h1}`}>
          Quem está fazendo as tarefas hoje?
        </h1>

        {children.length === 0 && (
          <p className="text-xl text-gray-500 text-center -mt-8 mb-8">
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
                className="w-40 h-40 rounded-full bg-white border-8 border-white shadow-xl flex items-center justify-center text-8xl transition-all group-hover:shadow-2xl"
                style={{ boxShadow: `0 0 0 8px ${child.color}` }}
              >
                {child.avatar}
              </div>
              <span className="text-3xl font-bold text-[#5C4033]">{child.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'rewards') {
    return (
      <div className={`min-h-screen ${colors.background} p-8 flex flex-col`}>
        <header className="flex justify-between items-center mb-10">
          <button
            onClick={() => setStep('tasks')}
            className="flex items-center gap-2 text-gray-500 font-bold text-xl hover:text-[#5C4033] transition-colors"
          >
            <ArrowLeft size={24} />
            Voltar
          </button>
          <div className="flex items-center gap-2 bg-yellow-100 px-6 py-3 rounded-full shadow-sm border-2 border-yellow-200">
            <Star className="text-yellow-600 fill-yellow-600" size={24} />
            <span className="text-2xl font-bold text-yellow-800">{selectedChild.points || 0} pts</span>
          </div>
        </header>
        <h2 className="text-4xl font-bold text-[#5C4033] mb-6">Recompensas</h2>
        {message && <p className="text-2xl text-[#5C4033] mb-6">{message}</p>}
        {rewards.length === 0 ? (
          <p className="text-2xl text-gray-400">Os papais ainda não cadastraram recompensas.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((r) => {
              const can = (selectedChild.points || 0) >= r.cost_points;
              return (
                <button
                  key={r.id}
                  onClick={() => redeem(r)}
                  disabled={!can}
                  className={`p-6 rounded-[32px] border-4 flex items-center gap-6 text-left transition-all ${
                    can ? 'bg-white border-yellow-300 shadow-sm active:scale-95' : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="text-5xl bg-white p-4 rounded-2xl shadow-sm">{r.icon || '🎁'}</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-[#5C4033]">{r.title}</h3>
                    <p className="text-gray-500 mt-1">{can ? 'Tocar para pedir' : `Faltam ${r.cost_points - (selectedChild.points || 0)} pts`}</p>
                  </div>
                  <div className="text-2xl font-black text-[#5C4033]">{r.cost_points} pts</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.background} p-8 flex flex-col`}>
      <header className="flex justify-between items-center mb-10">
        <button
          onClick={() => setStep('selection')}
          className="flex items-center gap-2 text-gray-500 font-bold text-xl hover:text-[#5C4033] transition-colors"
        >
          <ArrowLeft size={24} />
            Trocar Criança
        </button>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm border-2 border-[#EEDCDF]">
            <span className="text-4xl">{selectedChild.avatar}</span>
            <span className="text-2xl font-bold text-[#5C4033]">{selectedChild.name}</span>
          </div>
          <div className="flex items-center gap-2 bg-yellow-100 px-6 py-3 rounded-full shadow-sm border-2 border-yellow-200">
            <Star className="text-yellow-600 fill-yellow-600" size={24} />
            <span className="text-2xl font-bold text-yellow-800">{selectedChild.points || 0} pts</span>
          </div>
          <button
            onClick={openRewards}
            className="flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-sm border-2 border-[#EEDCDF] text-2xl font-bold text-[#5C4033] active:scale-95"
          >
            <Gift size={24} />
            Prêmios
          </button>
        </div>
      </header>

      <main className="flex-1">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-4xl font-bold text-[#5C4033]">Minhas Tarefas de Hoje</h2>
          <div className="text-xl font-medium text-gray-500">
            {tasks.filter(t => t.status === 'approved').length} de {tasks.length} completas
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#5C4033]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <p className="text-3xl text-gray-400 font-medium">Tudo limpo por aqui! 🎉</p>
              </div>
            ) : (
              tasks.map((instance) => (
                <div
                  key={instance.id}
                  className={`p-6 rounded-[32px] border-4 transition-all flex items-center gap-6 cursor-pointer active:scale-95 ${
                    instance.status === 'approved'
                      ? 'bg-green-50 border-green-200 opacity-80'
                      : instance.status === 'awaiting_approval'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-white border-[#EEDCDF] shadow-sm'
                  }`}
                  onClick={() => instance.status === 'pending' && markTaskDone(instance.id)}
                >
                  <div className="text-5xl bg-white p-4 rounded-2xl shadow-sm">
                    {instance.tasks.icon || '✨'}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-2xl font-bold ${instance.status === 'approved' ? 'text-green-800 line-through' : 'text-[#5C4033]'}`}>
                      {instance.tasks.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {instance.status === 'approved' && (
                        <span className="flex items-center gap-1 text-green-600 font-bold text-sm">
                        <CheckCircle2 size={16} /> Aprovado!
                        </span>
                      )}
                      {instance.status === 'awaiting_approval' && (
                        <span className="flex items-center gap-1 text-yellow-600 font-bold text-sm">
                        <Clock size={16} /> Aguardando papais...
                        </span>
                      )}
                      {instance.status === 'pending' && (
                        <span className="text-gray-400 font-medium text-sm">Tocar para concluir</span>
                      )}
                    </div>
                  </div>
                  <div className="text-2xl font-black text-[#5C4033]">
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
