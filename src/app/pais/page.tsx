import React from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function ParentsDashboard() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-[#5C4033]">Resumo do Dia</h1>

      {/* Fila de Aprovação */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="text-yellow-600" />
          <h2 className="text-xl font-bold text-gray-700">Aguardando Aprovação</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white p-6 rounded-[24px] border-2 border-yellow-200 flex flex-col gap-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🧹</span>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">Arrumar o quarto</h3>
                    <p className="text-sm text-gray-500">Feito por <span className="font-bold">Criança 1</span> às 14:30</p>
                  </div
                </div
                <span className="font-bold text-[#5C4033]">10 pts</span>
              </div
              <div className="flex gap-3">
                <button className="flex-1 py-3 bg-green-500 text-white rounded-2xl font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2">
                  <CheckCircle size={20} />
                  Aprovar
                </button>
                <button className="flex-1 py-3 bg-red-100 text-red-600 rounded-2xl font-bold hover:bg-red-200 transition-all flex items-center justify-center gap-2">
                  <XCircle size={20} />
                  Devolver
                </button>
              </div
            </div
          ))}

          {/* Empty state placeholder */}
          <div className="border-2 border-dashed border-gray-200 rounded-[24px] p-6 flex items-center justify-center text-gray-400 text-center italic">
            Nenhuma outra tarefa aguardando.
          </div
        </div
      </section>

      {/* Status Geral */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-700">Progresso das Crianças</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-4 rounded-[24px] border-2 border-[#EEDCDF] text-center">
              <div className="text-4xl mb-2">👦</div>
              <h3 className="font-bold text-gray-800">Criança {i}</h3>
              <div className="text-2xl font-bold text-[#5C4033] my-1">45 / 100 pts</div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div className="bg-green-400 h-full w-[45%]" />
              </div
            </div
          ))}
        </div
      </section>
    </div>
  )
}
