"use client";
import React from 'react';
import { Calendar, TrendingUp, Trophy, History } from 'lucide-react';

export default function HistoryPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-ink">Histórico de Conquistas</h1>
        <div className="flex gap-2">
          <div className="bg-surface-raised px-4 py-2 rounded-full border-2 border-line flex items-center gap-2 font-bold text-ink">
            <Trophy size={20} className="text-waiting-fg" />
            Total: 1,250 pts
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cards de Crianças */}
        {[
          { name: 'Lucas', points: 450, color: 'bg-brand-soft text-brand-ink' },
          { name: 'Julia', points: 600, color: 'bg-pink-100 text-pink-800' },
          { name: 'Téo', points: 200, color: 'bg-brand-soft text-brand-ink' },
        ].map((child) => (
          <div key={child.name} className="bg-surface-raised p-6 rounded-[32px] border-2 border-line text-center shadow-sm">
            <div className={`inline-block px-4 py-1 rounded-full text-sm font-bold mb-4 ${child.color}`}>
              {child.name}
            </div>
            <div className="text-4xl font-black text-ink mb-2">{child.points} pts</div>
            <div className="flex items-center justify-center gap-1 text-approved-fg font-bold text-sm">
              <TrendingUp size={16} />
              +20 pts esta semana
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface-raised rounded-[32px] border-2 border-line overflow-hidden shadow-sm">
        <div className="p-6 border-b-2 border-line flex items-center gap-2 font-bold text-ink text-xl">
          <History size={24} />
          Linha do Tempo de Tarefas
        </div>
        <div className="divide-y divide-line">
          {[
            { date: 'Hoje', task: 'Arrumar o quarto', child: 'Lucas', points: 10, status: 'approved' },
            { date: 'Ontem', task: 'Lavar a louça', child: 'Julia', points: 15, status: 'approved' },
            { date: '03 Out', task: 'Alimentar o pet', child: 'Téo', points: 5, status: 'approved' },
            { date: '02 Out', task: 'Guardar brinquedos', child: 'Lucas', points: 10, status: 'rejected' },
          ].map((item, i) => (
            <div key={i} className="p-4 flex items-center justify-between hover:bg-surface-sunken transition-colors">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-ink-muted w-20">{item.date}</span>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.status === 'approved' ? '✅' : '❌'}</span>
                  <span className="font-bold text-ink-muted">{item.task}</span>
                  <span className="text-sm text-ink-muted">• {item.child}</span>
                </div>
              </div>
              <span className={`font-bold ${item.status === 'approved' ? 'text-approved-fg' : 'text-returned-fg'}`}>
                {item.status === 'approved' ? `+${item.points} pts` : '0 pts'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
