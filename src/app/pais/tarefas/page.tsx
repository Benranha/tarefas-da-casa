import React from 'react';
import { Plus, Trash2, Edit2, Calendar } from 'lucide-react';

export default function TasksPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#5C4033]">Gestão de Tarefas</h1>
        <button className="flex items-center gap-2 bg-[#5C4033] text-white px-4 py-2 rounded-2xl font-bold hover:bg-[#4A3329] transition-all">
          <Plus size={20} />
          Nova Tarefa
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-[24px] border-2 border-[#EEDCDF] shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-[#EEDCDF] bg-gray-50 text-[#5C4033] font-bold">
              <th className="p-4">Tarefa</th>
              <th className="p-4">Criança</th>
              <th className="p-4">Pontos</th>
              <th className="p-4">Recorrência</th>
              <th className="p-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[1, 2, 3].map((i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🧹</span>
                    <span className="font-medium text-gray-800">Arrumar o quarto</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                    Criança 1
                  </span>
                </td>
                <td className="p-4 font-bold text-[#5C4033]">10 pts</td>
                <td className="p-4">
                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <Calendar size={14} />
                    Diária
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex justify-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
