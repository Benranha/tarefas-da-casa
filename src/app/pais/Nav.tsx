"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { User, ListChecks, History, Inbox, Moon, Gift, Users } from 'lucide-react';

const items = [
  { name: 'Fila', href: '/pais', icon: Inbox },
  { name: 'Crianças', href: '/pais/criancas', icon: User },
  { name: 'Tarefas', href: '/pais/tarefas', icon: ListChecks },
  { name: 'Histórico', href: '/pais/historico', icon: History },
  { name: 'Recompensas', href: '/pais/recompensas', icon: Gift },
  { name: 'Família', href: '/pais/familia', icon: Users },
];

const THEME_KEY = 'tarefinha-theme';
const MODE_KEY = 'tarefinhaMode';

function panel() {
  return document.querySelector<HTMLElement>('.tf-painel');
}

export default function Nav({ signOut }: { signOut: () => Promise<void> }) {
  const pathname = usePathname();

  // Tema escuro só no painel dos pais: segue o sistema, ou a escolha salva no botão.
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch {}
    const dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    panel()?.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, []);

  function toggleTheme() {
    const el = panel();
    if (!el) return;
    const next = el.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    el.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch {}
  }
  return (
    <nav
      aria-label="Principal"
      className="tf-nav fixed bottom-0 left-0 right-0 z-50 md:static md:flex-col md:w-64 md:border-t-0 md:border-r-2 md:p-6 md:gap-1"
    >
      <div className="hidden md:block mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/tarefinha-horizontal-claro.svg" alt="Tarefinha" className="h-10 dark-invert" />
      </div>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={pathname === item.href || (item.href !== '/pais' && pathname.startsWith(item.href + '/')) ? 'page' : undefined}
          className="tf-nav__item md:flex-row md:justify-start md:gap-3 md:px-4 md:text-base md:font-extrabold"
        >
          <item.icon size={20} />
          <span>{item.name}</span>
        </Link>
      ))}
      <button type="button" onClick={toggleTheme} className="tf-nav__item md:flex-row md:justify-start md:gap-3 md:px-4 md:text-base md:mt-auto">
        <Moon size={20} />
        <span>Tema</span>
      </button>
      {/* Ao sair, esquece o modo "app" deste aparelho para ele poder virar painel de novo. */}
      <form
        action={signOut}
        onSubmit={() => {
          try {
            if (localStorage.getItem(MODE_KEY) === 'app') localStorage.removeItem(MODE_KEY);
          } catch {}
        }}
      >
        <button className="tf-nav__item w-full md:flex-row md:justify-start md:px-4 md:text-base">Sair</button>
      </form>
    </nav>
  );
}
