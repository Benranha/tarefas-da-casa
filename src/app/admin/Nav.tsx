"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect } from 'react';
import { LayoutDashboard, Users, Activity, CreditCard, Moon, LogOut } from 'lucide-react';

const items = [
  { name: 'Visão geral', href: '/admin', icon: LayoutDashboard },
  { name: 'Assinantes', href: '/admin/assinantes', icon: Users },
  { name: 'Engajamento', href: '/admin/engajamento', icon: Activity },
  { name: 'Receita', href: '/admin/receita', icon: CreditCard },
];

const THEME_KEY = 'tarefinha-theme';

const isActive = (pathname: string, href: string) =>
  pathname === href || (href !== '/admin' && pathname.startsWith(href + '/'));

function panel() {
  return document.querySelector<HTMLElement>('.tf-painel');
}

export default function AdminNav({ signOut }: { signOut: () => Promise<void> }) {
  const pathname = usePathname();

  // Mesmo tema do painel dos pais: segue o sistema ou a escolha salva.
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
    <nav aria-label="Admin" className="ad-nav">
      <div className="ad-nav__brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/tarefinha-horizontal-claro.svg" alt="Tarefinha" className="h-9 dark-invert" />
        <span className="ad-pill-admin">Admin</span>
      </div>
      {items.map((item) => (
        <Link key={item.href} href={item.href} aria-current={isActive(pathname, item.href) ? 'page' : undefined} className="ad-nav__item">
          <item.icon size={20} strokeWidth={2} />
          <span>{item.name}</span>
        </Link>
      ))}
      <button type="button" onClick={toggleTheme} className="ad-nav__item ad-nav__spacer">
        <Moon size={20} />
        <span>Tema</span>
      </button>
      <form action={signOut}>
        <button className="ad-nav__item w-full">
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </form>
    </nav>
  );
}
