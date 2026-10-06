"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, ListChecks, History, Inbox } from 'lucide-react';

const items = [
  { name: 'Fila', href: '/pais', icon: Inbox },
  { name: 'Crianças', href: '/pais/criancas', icon: User },
  { name: 'Tarefas', href: '/pais/tarefas', icon: ListChecks },
  { name: 'Histórico', href: '/pais/historico', icon: History },
];

export default function Nav({ signOut }: { signOut: () => Promise<void> }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="tf-nav fixed bottom-0 left-0 right-0 z-50 md:static md:flex-col md:w-64 md:border-t-0 md:border-r-2 md:p-6 md:gap-1"
    >
      <div className="hidden md:block mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/tarefinha-horizontal-claro.svg" alt="Tarefinha" className="h-10" />
      </div>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={pathname === item.href ? 'page' : undefined}
          className="tf-nav__item md:flex-row md:justify-start md:gap-3 md:px-4 md:text-base md:font-extrabold"
        >
          <item.icon size={20} />
          <span>{item.name}</span>
        </Link>
      ))}
      <form action={signOut} className="md:mt-auto">
        <button className="tf-nav__item w-full md:flex-row md:justify-start md:px-4 md:text-base">Sair</button>
      </form>
    </nav>
  );
}
