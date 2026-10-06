"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { User, ListChecks, History, Inbox, Moon, Gift, Users, Plus, Ellipsis, X, ChevronRight, LogOut } from 'lucide-react';

const items = [
  { name: 'Fila', href: '/pais', icon: Inbox },
  { name: 'Crianças', href: '/pais/criancas', icon: User },
  { name: 'Tarefas', href: '/pais/tarefas', icon: ListChecks },
  { name: 'Histórico', href: '/pais/historico', icon: History },
  { name: 'Recompensas', href: '/pais/recompensas', icon: Gift },
  { name: 'Família', href: '/pais/familia', icon: Users },
];

const MORE = [
  { name: 'Recompensas', href: '/pais/recompensas', icon: Gift },
  { name: 'Histórico', href: '/pais/historico', icon: History },
  { name: 'Família', href: '/pais/familia', icon: Users },
];

const THEME_KEY = 'tarefinha-theme';
const MODE_KEY = 'tarefinhaMode';

function panel() {
  return document.querySelector<HTMLElement>('.tf-painel');
}

const isActive = (pathname: string, href: string) =>
  pathname === href || (href !== '/pais' && pathname.startsWith(href + '/'));

// Ao sair, esquece o modo "app" deste aparelho para ele poder virar painel de novo.
function forgetAppMode() {
  try {
    if (localStorage.getItem(MODE_KEY) === 'app') localStorage.removeItem(MODE_KEY);
  } catch {}
}

export default function Nav({ signOut }: { signOut: () => Promise<void> }) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [dark, setDark] = useState(false);
  const [pending, setPending] = useState(0);

  // Contagem da Fila: busca ao montar/trocar de rota e acompanha o que a própria Fila avisa.
  useEffect(() => {
    let alive = true;
    fetch('/api/pais/pending', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((list) => alive && Array.isArray(list) && setPending(list.length))
      .catch(() => {});
    const onPending = (e: Event) => setPending((e as CustomEvent<number>).detail);
    window.addEventListener('tf-pending', onPending);
    return () => {
      alive = false;
      window.removeEventListener('tf-pending', onPending);
    };
  }, [pathname]);

  function openSheet() {
    setDark(panel()?.getAttribute('data-theme') === 'dark');
    setSheetOpen(true);
  }
  function closeSheet() {
    setSheetOpen(false);
    setConfirmSignOut(false);
  }

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
    setDark(next === 'dark');
  }
  const moreActive = sheetOpen || MORE.some((m) => isActive(pathname, m.href));

  return (
    <>
    <nav aria-label="Principal" className="tf-nav tf-nav--desktop">
      <div className="hidden md:block mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/tarefinha-horizontal-claro.svg" alt="Tarefinha" className="h-9 dark-invert" />
      </div>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(pathname, item.href) ? 'page' : undefined}
          className="tf-nav__item"
        >
          <item.icon size={20} />
          <span>{item.name}</span>
        </Link>
      ))}
      <button type="button" onClick={toggleTheme} className="tf-nav__item tf-nav__spacer">
        <Moon size={20} />
        <span>Tema</span>
      </button>
      <form action={signOut} onSubmit={forgetAppMode}>
        <button className="tf-nav__item w-full">Sair</button>
      </form>
    </nav>

    {/* Celular: pílula flutuante + sheet "Mais" */}
    <nav aria-label="Principal" className="tf-pill">
      <PillTab href="/pais" label="Fila" icon={Inbox} pathname={pathname} badge={pending} />
      <PillTab href="/pais/criancas" label="Crianças" icon={User} pathname={pathname} />
      <Link href="/pais/tarefas?nova=1" aria-label="Adicionar tarefa" className="tf-pill__add">
        <Plus size={30} />
      </Link>
      <PillTab href="/pais/tarefas" label="Tarefas" icon={ListChecks} pathname={pathname} />
      <button
        type="button"
        onClick={openSheet}
        aria-label="Mais"
        aria-haspopup="dialog"
        aria-expanded={sheetOpen}
        className="tf-pill__item"
        data-active={moreActive || undefined}
      >
        <Ellipsis size={22} />
        {moreActive && <span>Mais</span>}
      </button>
    </nav>

    {sheetOpen && (
      <div className="tf-overlay" onClick={closeSheet}>
        <div className="tf-sheet" role="dialog" aria-modal="true" aria-label="Mais" onClick={(e) => e.stopPropagation()}>
          <span className="tf-sheet__handle" aria-hidden="true" />
          <div className="tf-sheet__head">
            <h2>Mais</h2>
            <button type="button" onClick={closeSheet} aria-label="Fechar" className="tf-sheet__close">
              <X size={20} />
            </button>
          </div>
          {MORE.map((m) => (
            <Link key={m.href} href={m.href} onClick={closeSheet} className="tf-sheet__row" aria-current={isActive(pathname, m.href) ? 'page' : undefined}>
              <span className="tf-sheet__icon"><m.icon size={22} /></span>
              <span className="tf-sheet__label">{m.name}</span>
              <ChevronRight size={20} className="text-line-strong" />
            </Link>
          ))}
          <button type="button" onClick={toggleTheme} role="switch" aria-checked={dark} className="tf-sheet__row">
            <span className="tf-sheet__icon"><Moon size={22} /></span>
            <span className="tf-sheet__label">Tema escuro</span>
            <span className="tf-switch" data-on={dark || undefined} aria-hidden="true" />
          </button>
          <hr className="tf-sheet__divider" />
          {confirmSignOut ? (
            <form action={signOut} onSubmit={forgetAppMode} className="tf-sheet__confirm">
              <p>Sair da conta neste aparelho?</p>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setConfirmSignOut(false)} className="tf-btn tf-btn--secondary !min-h-[52px]">Cancelar</button>
                <button type="submit" className="tf-btn tf-btn--return !min-h-[52px]">Sair</button>
              </div>
            </form>
          ) : (
            <button type="button" onClick={() => setConfirmSignOut(true)} className="tf-sheet__row tf-sheet__row--danger">
              <span className="tf-sheet__icon"><LogOut size={22} /></span>
              <span className="tf-sheet__label">Sair da conta</span>
            </button>
          )}
        </div>
      </div>
    )}
    </>
  );
}

function PillTab({
  href, label, icon: Icon, pathname, badge,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ size?: number }>
  pathname: string
  badge?: number
}) {
  const active = isActive(pathname, href);
  return (
    <Link href={href} aria-label={label} aria-current={active ? 'page' : undefined} className="tf-pill__item" data-active={active || undefined}>
      <Icon size={22} />
      {active && <span>{label}</span>}
      {!!badge && <span className="tf-pill__badge" aria-label={`${badge} aguardando`}>{badge}</span>}
    </Link>
  );
}
