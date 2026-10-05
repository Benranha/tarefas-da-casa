import React from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';

export default function ChildrenPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#5C4033]">Gestão de Crianças</h1>
        <button className="flex items-center gap-2 bg-[#5C4033] text-white px-4 py-2 rounded-2xl font-bold hover:bg-[#4A3329] transition-all">
          <Plus size={20} />
          Adicionar Criança
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Placeholder de Criança */}
        {[1, 2].map((i) => (
          <div key={i} className="bg-white p-6 rounded-[24px] border-2 border-[#EEDCDF] flex items-center gap-4 shadow-sm">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
              👦
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#5C4033]">Criança Exemplo {i}</h3>
              <p className="text-gray-500 text-sm">120 pontos acumulados</p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                <Edit2 size={20} />
              </button>
              <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
