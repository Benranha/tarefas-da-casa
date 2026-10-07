import Link from 'next/link';
import { Search, X } from 'lucide-react';
import {
  subscribers, familyDetail, STATUSES, STATUS_LABEL, STATUS_TONE, FILTER_LABEL, familyName, type Status, type SubscriberRow,
} from '@/lib/admin';
import { UUID } from '@/lib/http';
import { Chip, fmtInt, fmtDec, fmtDM } from '../ui';
import FamilyActions from './Actions';

const KID_COLORS = ['#2f5bea', '#c8266b', '#3f7d20', '#9a5b06', '#7a3fe0', '#0b7a85', '#c8362b'];
const KID_SOFT = ['#e2e8fc', '#f7e1ea', '#e4ede0', '#f1e8dc', '#ece4fb', '#ddecee', '#f7e3e1'];
const KID_NAMES = ['azul', 'rosa', 'verde', 'mostarda', 'roxo', 'turquesa', 'tomate'];

function colorOf(key: string | null | undefined, fallbackSeed: string) {
  const i = KID_NAMES.indexOf(String(key ?? '').toLowerCase());
  const idx = i >= 0 ? i : [...fallbackSeed].reduce((a, c) => a + c.charCodeAt(0), 0) % KID_COLORS.length;
  return { solid: KID_COLORS[idx], soft: KID_SOFT[idx] };
}

const DAY = 86400000;
function when(r: Pick<SubscriberRow, 'status' | 'trial_ends_at' | 'current_period_end' | 'canceled_at' | 'last_payment_failed_at'>) {
  const dm = (v: string | null) => (v ? fmtDM(new Date(new Date(v).getTime() - 4 * 3600000).toISOString()) : '');
  if (r.status === 'active') return r.current_period_end ? `renova ${dm(r.current_period_end)}` : 'ativo';
  if (r.status === 'trialing') {
    const d = Math.max(0, Math.ceil((new Date(r.trial_ends_at).getTime() - Date.now()) / DAY));
    return d === 0 ? 'termina hoje' : `termina em ${d} ${d === 1 ? 'dia' : 'dias'}`;
  }
  if (r.status === 'past_due') return `falhou ${dm(r.last_payment_failed_at)}`;
  if (r.status === 'expired') return `terminou ${dm(r.trial_ends_at)}`;
  return `cancelou ${dm(r.canceled_at)}`;
}

export default async function AdminSubscribers({ searchParams }: PageProps<'/admin/assinantes'>) {
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : '');
  const status = STATUSES.find((s) => s === str('status')) as Status | undefined;
  const search = str('q').trim().slice(0, 80);
  const trialDays = str('vence') === '7d' ? 7 : undefined;
  const selId = UUID.test(str('f')) ? str('f') : '';

  const [{ rows, byStatus, total }, detail] = await Promise.all([
    subscribers({ status, search: search || undefined, trialDays }),
    selId ? familyDetail(selId) : Promise.resolve(null),
  ]);

  const qs = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const base: Record<string, string> = { status: status ?? '', q: search, vence: trialDays ? '7d' : '', f: selId, ...over };
    for (const [k, v] of Object.entries(base)) if (v) p.set(k, v);
    const s = p.toString();
    return `/admin/assinantes${s ? `?${s}` : ''}`;
  };

  const sparkMax = Math.max(1, ...(detail?.spark ?? [1]));

  return (
    <div className={`ad-subs${detail ? ' ad-subs--open' : ''}`}>
      <div className="ad-subs__list">
        <header className="ad-head">
          <h1 className="ad-h1">Assinantes</h1>
          <form action="/admin/assinantes" className="ad-search" role="search">
            {status && <input type="hidden" name="status" value={status} />}
            <Search size={18} aria-hidden="true" />
            <input name="q" defaultValue={search} placeholder="Buscar família ou e-mail" aria-label="Buscar família ou e-mail" />
          </form>
        </header>

        <nav className="ad-filters" aria-label="Filtrar por status">
          {[undefined, ...STATUSES].map((s) => {
            const count = s ? byStatus[s] ?? 0 : total;
            return (
              <Link key={s ?? 'todos'} href={qs({ status: s, vence: '', f: '' })} data-active={s === status || undefined} aria-current={s === status ? 'true' : undefined}>
                {s ? FILTER_LABEL[s] : 'Todos'} <span>{fmtInt(count)}</span>
              </Link>
            );
          })}
        </nav>
        {trialDays && <p className="ad-sub">Só testes que vencem em até 7 dias · <Link className="ad-link" href={qs({ vence: '' })}>limpar</Link></p>}

        <div className="tf-card ad-table" role="table" aria-label="Assinantes">
          <div className="ad-tr ad-tr--head" role="row">
            <span role="columnheader">Família</span><span role="columnheader">Status</span>
            <span role="columnheader">Crianças</span><span role="columnheader">Tarefas/dia</span><span role="columnheader">Teste / renova</span>
          </div>
          {rows.length === 0 && <p className="ad-empty">Nenhuma família neste filtro.</p>}
          {rows.map((r) => {
            const nm = familyName(r.name, r.email);
            const c = colorOf(null, r.owner_id);
            return (
              <Link key={r.owner_id} href={qs({ f: r.owner_id })} className="ad-tr" role="row" data-selected={r.owner_id === selId || undefined}>
                <span className="ad-fam">
                  <i className="ad-avatar" style={{ borderColor: c.solid, background: c.soft }}>{nm.replace('Família ', '')[0]?.toUpperCase()}</i>
                  <span><strong>{nm}</strong><small>{r.email}</small></span>
                </span>
                <span><Chip tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Chip></span>
                <span>{r.children}</span>
                <span>{fmtDec(Number(r.per_day ?? 0))}</span>
                <span className="ad-when">{when(r)}</span>
              </Link>
            );
          })}
        </div>
        {total > rows.length && rows.length === 100 && <p className="ad-sub">Mostrando as 100 mais recentes. Use a busca ou os filtros para achar as demais.</p>}
      </div>

      {detail && (
        <aside className="tf-card ad-ficha" aria-label="Ficha da família">
          <Link href={qs({ f: '' })} className="ad-ficha__close" aria-label="Fechar ficha"><X size={20} /></Link>
          <div className="ad-ficha__top">
            {(() => {
              const nm = familyName(detail.name, detail.email);
              const c = colorOf(null, detail.owner_id);
              return (
                <>
                  <i className="ad-avatar ad-avatar--lg" style={{ borderColor: c.solid, background: c.soft }}>{nm.replace('Família ', '')[0]?.toUpperCase()}</i>
                  <div><h2 className="ad-h2">{nm}</h2><small>{detail.email}</small></div>
                </>
              );
            })()}
          </div>
          <div className="ad-ficha__status"><Chip tone={STATUS_TONE[detail.status]}>{STATUS_LABEL[detail.status]}</Chip><span>{when(detail)}</span></div>
          <div className="ad-stats">
            <div><span>Cliente desde</span><strong>{new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric', timeZone: 'America/Manaus' }).format(new Date(detail.created_at))}</strong></div>
            <div><span>Responsáveis</span><strong>{detail.members}</strong></div>
            <div><span>Aprovação</span><strong>{detail.approvalPct == null ? '—' : `${detail.approvalPct}%`}</strong></div>
            <div><span>Último uso</span><strong>{detail.lastUse ? fmtDM(new Date(new Date(detail.lastUse).getTime() - 4 * 3600000).toISOString()) : '—'}</strong></div>
          </div>
          <div>
            <p className="ad-label">Tarefas aprovadas · 14 dias</p>
            <div className="ad-spark" role="img" aria-label="Tarefas aprovadas nos últimos 14 dias">
              {detail.spark.map((v, i) => <div key={i} title={String(v)} style={{ height: `${Math.max(4, (v / sparkMax) * 100)}%` }} />)}
            </div>
          </div>
          <ul className="ad-kids">
            {detail.kids.length === 0 && <li>Nenhuma criança cadastrada.</li>}
            {detail.kids.map((k) => {
              const c = colorOf(k.color, k.name);
              return <li key={k.name + k.color}><i style={{ background: c.solid }} /><strong>{k.name}</strong><small>{k.has_device ? 'Celular' : 'Totem'}</small></li>;
            })}
          </ul>
          <FamilyActions id={detail.owner_id} email={detail.email} status={detail.status} />
        </aside>
      )}
    </div>
  );
}
