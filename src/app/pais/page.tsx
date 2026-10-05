"use client";
import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { CheckCircle, XCircle, MessageCircle, AlertCircle } from 'lucide-react';
import { colors } from '@/styles/theme';

export default function ParentsDashboard() {
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchPendingTasks();

    const channel = supabase
      .channel('approval-queue')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_instances' },
        () => {
          fetchPendingTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchPendingTasks() {
    setLoading(true);
    const { data, error } = await supabase
      .from('task_instances')
      .select('*, tasks(*), children(*)')
      .eq('status', 'awaiting_approval')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar tarefas:', error);
    } else {
      setPendingTasks(data || []);
    }
    setLoading(false);
  }

  async function handleApprove(instanceId: string, childId: string, points: number) {
    const { error: updateError } = await supabase
      .from('task_instances')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString()
      })
      .eq('id', instanceId);

    if (updateError) {
      alert('Erro ao aprovar tarefa');
      return;
    }

    const { data: childData } = await supabase
      .from('children')
      .select('points')
      .eq('id', childId)
      .single();

    if (childData) {
      await supabase
        .from('children')
        .update({ points: (childData.points || 0) + points })
        .eq('id', childId);
    }

    await fetchPendingTasks();
  }

  async function handleReject(instanceId: string) {
    const note = prompt('Motivo da devolução (opcional):');

    const { error } = await supabase
      .from('task_instances')
      .update({
        status: 'pending',
        parent_note: note || 'Tarefa precisa de melhorias'
      })
      .eq('id', instanceId);

    if (error) {
      alert('Erro ao devolver tarefa');
    } else {
      await fetchPendingTasks();
    }
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
                  onClick={() => handleApprove(instance.id, instance.child_id, instance.tasks.points)}
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
