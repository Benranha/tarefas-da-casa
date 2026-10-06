import React from 'react';
import { User, ListChecks, History } from 'lucide-react';
import Link from 'next/link';
import { signOut } from '@/app/login/actions';

export default function ParentsLayout({ children }: { children: React.ReactNode }) {
  const menuItems = [
    { name: 'Dashboard', href: '/pais', icon: ListChecks },
    { name: 'Crianças', href: '/pais/criancas', icon: User },
    { name: 'Tarefas', href: '/pais/tarefas', icon: ListChecks },
    { name: 'Histórico', href: '/pais/historico', icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBFA] flex flex-col md:flex-row">
      {/* Sidebar - Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 flex justify-around items-center md:relative md:w-64 md:flex-col md:justify-start md:p-6 md:border-r md:border-t-0 z-50">
        <div className="hidden md:block mb-10">
          <h1 className="text-2xl font-bold text-[#5C4033]">Tarefinha</h1>
        </div>
        <div className="flex md:flex-col justify-around w-full md:gap-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col md:flex-row items-center gap-2 p-3 rounded-2xl hover:bg-gray-100 text-gray-600 hover:text-[#5C4033] transition-all text-xs md:text-base font-medium"
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
        <form action={signOut} className="md:mt-auto">
          <button className="p-3 text-xs md:text-base text-gray-500 hover:text-[#5C4033] font-medium">
            Sair
          </button>
        </form>
      </nav>

      <main className="flex-1 p-4 md:p-10 pb-24 md:pb-10">
        {children}
      </main>
    </div>
  );
}
