"use client";
import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, MessageCircle, AlertCircle } from 'lucide-react';
import { colors } from '@/styles/theme';

export default function ParentsDashboard() {
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totemUrl, setTotemUrl] = useState('');
  const [copied, setCopied] = useState(false);

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
    const note = prompt('Motivo da devolução (opcional):');
    const res = await fetch(`/api/pais/instances/${instanceId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    });
    if (!res.ok) {
      alert('Erro ao devolver tarefa');
    }
    await fetchPendingTasks();
  }

  if (loading && pendingTasks.length === 0) {
    return <div className="p-10 text-center text-gray-500">Carregando fila de aprovação...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#5C4033]">Fila de Aprovação</h1>
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-bold text-sm border border-yellow-200">
          {pendingTasks.length} tarefas pendentes
        </div>
      </div>

      {totemUrl && (
        <div className="bg-white p-5 rounded-[24px] border-2 border-[#EEDCDF] flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#5C4033]">Link do totem (tablet das crianças)</p>
            <p className="text-sm text-gray-500 truncate">{totemUrl}</p>
          </div>
          <button
            onClick={copyTotemUrl}
            className="px-4 py-2 bg-[#5C4033] text-white rounded-2xl font-bold hover:bg-[#4A3329]"
          >
            {copied ? 'Copiado!' : 'Copiar link'}
          </button>
        </div>
      )}

      {pendingTasks.length === 0 ? (
        <div className="bg-white p-12 rounded-[32px] border-2 border-dashed border-gray-200 text-center space-y-4">
          <div className="flex justify-center text-gray-300">
            <CheckCircle size={64} />
          </div>
          <p className="text-xl text-gray-500 font-medium">Tudo em dia! Não há tarefas aguardando aprovação.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pendingTasks.map((instance) => (
            <div
              key={instance.id}
              className="bg-white p-6 rounded-[32px] border-2 border-yellow-200 shadow-sm flex flex-col gap-4 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-2 h-full bg-yellow-400" />

              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <span className="text-4xl bg-gray-50 p-3 rounded-2xl">{instance.tasks.icon || '✨'}</span>
                  <div>
                    <h3 className="font-bold text-xl text-gray-800">{instance.tasks.title}</h3>
                    <p className="text-gray-500 flex items-center gap-1">
                      <span className="font-bold text-[#5C4033]">{instance.children.name}</span>
                      <span>• {new Date(instance.completed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-xs text-gray-400 font-bold uppercase">Pontos</span>
                  <span className="text-2xl font-black text-[#5C4033]">{instance.tasks.points} pts</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleApprove(instance.id)}
                  className="flex-1 py-4 bg-green-500 text-white rounded-2xl font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
                >
                  <CheckCircle size={20} />
                  Aprovar
                </button>
                <button
                  onClick={() => handleReject(instance.id)}
                  className="flex-1 py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2 active:scale-95 border border-red-100"
                >
                  <XCircle size={20} />
                  Devolver
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
