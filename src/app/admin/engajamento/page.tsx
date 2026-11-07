import React from 'react';
import Link from 'next/link';
import {
  engagement, lastUse, awayKey, AWAY_BUCKETS, familyName, STATUS_LABEL, STATUS_TONE, type AwayKey,
} from '@/lib/admin';
import { Chip, Kpi, fmtInt, fmtDec } from '../ui';

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7);
const WEEKS = [1, 2, 3, 4, 6, 8];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const USE_FILTERS: { key: AwayKey; label: string }[] = [...AWAY_BUCKETS, { key: 'nunca', label: 'Nunca usou' }];
const LIST_MAX = 200;

const fmtWhen = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Manaus',
});
function whenUsed(iso: string) {
  const p = Object.fromEntries(fmtWhen.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { day: `${p.weekday.replace('.', '')}, ${p.day}/${p.month}/${p.year}`, time: `${p.hour}:${p.minute}` };
}
function awayLabel(away: number | null) {
  if (away == null) return 'nunca usou';
  if (away === 0) return 'usou hoje';
  if (away === 1) return 'há 1 dia';
  return `há ${away} dias`;
}
function awayTone(away: number | null) {
  if (away == null) return 'off' as const;
  if (away <= 3) return 'ok' as const;
  if (away <= 7) return 'wait' as const;
  return 'bad' as const;
}

export default async function AdminEngagement({ searchParams }: PageProps<'/admin/engajamento'>) {
  const raw = (await searchParams).uso;
  const filter = USE_FILTERS.find((f) => f.key === raw)?.key;
  const [{ kpi, heat, cohorts, resources }, uses] = await Promise.all([engagement(), lastUse()]);
  const counts: Record<string, number> = {};
  for (const u of uses) { const k = awayKey(u.away); counts[k] = (counts[k] ?? 0) + 1; }
  const shown = filter ? uses.filter((u) => awayKey(u.away) === filter) : uses;
  const peak = Math.max(1, ...Object.values(heat));

  const resourceRows: [string, number, string][] = [
    ['Criança com celular próprio', resources.device, 'var(--brand)'],
    ['Notificações push ativas', resources.push, 'var(--brand)'],
    ['Mais de um responsável', resources.multi, 'var(--brand)'],
    ['Usa recompensas', resources.rewards, 'var(--sun)'],
  ];

  return (
    <div className="ad-page">
      <header className="ad-head"><div><h1 className="ad-h1">Engajamento</h1><p className="ad-sub">Como e quando as famílias usam o Tarefinha</p></div></header>

      <section className="ad-grid4" aria-label="Indicadores">
        <Kpi label="Tarefas/dia por família" value={fmtDec(kpi.perFamily)} chip="média, famílias ativas" />
        <Kpi label="Crianças por família" value={fmtDec(kpi.kidsPerFamily)} chip={`${fmtInt(kpi.children)} crianças`} />
        <Kpi label="Tarefas recorrentes" value={`${kpi.recurringPct}%`} chip="diárias ou semanais" />
        <Kpi label="Recompensas resgatadas" value={fmtInt(kpi.redeemed)} chip={`no mês · ${kpi.deliveredPct}% entregues`} />
      </section>

      <section className="tf-card ad-card">
        <h2 className="ad-h2">Quando as tarefas são feitas</h2>
        <p className="ad-sub">Últimos 90 dias · horário de Manaus</p>
        <div className="ad-heat" role="img" aria-label="Mapa de calor das tarefas por dia da semana e hora">
          <span />
          {HOURS.map((h) => <small key={h}>{h}h</small>)}
          {DAYS.map((d, di) => (
            <React.Fragment key={d}>
              <small className="ad-heat__day">{d}</small>
              {HOURS.map((h) => {
                const c = heat[`${di + 1}-${h}`] ?? 0;
                const v = c / peak;
                return <i key={h} title={`${d} ${h}h: ${c}`} style={{ background: v < 0.12 ? 'var(--surface-sunken)' : `rgba(192,67,14,${0.15 + 0.85 * v})` }} />;
              })}
            </React.Fragment>
          ))}
        </div>
        <div className="ad-legend">Menos <i style={{ background: 'var(--surface-sunken)' }} /><i style={{ background: 'rgba(192,67,14,.4)' }} /><i style={{ background: 'rgba(192,67,14,.7)' }} /><i style={{ background: 'rgba(192,67,14,1)' }} /> Mais</div>
      </section>

      <section className="ad-row2 ad-row2--wide">
        <div className="tf-card ad-card">
          <h2 className="ad-h2">Retenção por safra</h2>
          <p className="ad-sub">% das famílias com ao menos 1 tarefa aprovada na semana</p>
          <div className="ad-ret">
            <span />{WEEKS.map((w) => <small key={w}>S{w}</small>)}
            {cohorts.length === 0 && <p className="ad-empty" style={{ gridColumn: '1 / -1' }}>Ainda sem dados.</p>}
            {cohorts.map((c) => {
              const [y, m] = c.month.split('-');
              return (
                <React.Fragment key={c.month}>
                  <small className="ad-ret__row"><b>{MONTHS[Number(m) - 1]}/{y.slice(2)}</b> {fmtInt(c.size)} fam.</small>
                  {WEEKS.map((w) => {
                    const v = c.weeks[w];
                    if (v == null) return <i key={w} />;
                    return <i key={w} style={{ background: `rgba(21,128,61,${Math.max(0, Math.min(1, (v - 40) / 50))})`, color: v >= 70 ? '#fff' : 'var(--approved-fg)' }}>{v}%</i>;
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
        <div className="tf-card ad-card">
          <h2 className="ad-h2">Uso de recursos</h2>
          <div className="ad-funnel">
            {resourceRows.map(([label, v, color]) => (
              <div key={label}>
                <div className="ad-funnel__row"><span>{label}</span><strong>{v}%</strong></div>
                <div className="ad-track ad-track--sm"><div className="ad-fill" style={{ width: `${v}%`, background: color }} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ad-uso" aria-labelledby="uso-title">
        <div>
          <h2 className="ad-h2" id="uso-title">Último uso por família</h2>
          <p className="ad-sub">Quando a família abriu o app pela última vez: criança marcando tarefa ou responsável no painel · horário de Manaus</p>
        </div>
        <nav className="ad-filters" aria-label="Filtrar por dias sem abrir o app">
          <Link href="/admin/engajamento" data-active={!filter || undefined} aria-current={!filter ? 'true' : undefined}>Todas <span>{fmtInt(uses.length)}</span></Link>
          {USE_FILTERS.map((f) => (
            <Link key={f.key} href={`/admin/engajamento?uso=${f.key}`} data-active={f.key === filter || undefined} aria-current={f.key === filter ? 'true' : undefined}>
              {f.label} <span>{fmtInt(counts[f.key] ?? 0)}</span>
            </Link>
          ))}
        </nav>
        <div className="tf-card ad-table" role="table" aria-label="Último uso por família">
          <div className="ad-tr ad-tr--uso ad-tr--head" role="row">
            <span role="columnheader">Família</span><span role="columnheader">Status</span>
            <span role="columnheader">Último uso</span><span role="columnheader">Sem abrir</span><span role="columnheader">Dias de uso · 30d</span>
          </div>
          {shown.length === 0 && <p className="ad-empty">Nenhuma família neste filtro.</p>}
          {shown.slice(0, LIST_MAX).map((u) => {
            const w = u.last_at ? whenUsed(u.last_at) : null;
            return (
              <Link key={u.owner_id} href={`/admin/assinantes?f=${u.owner_id}`} className="ad-tr ad-tr--uso" role="row">
                <span className="ad-fam"><span><strong>{familyName(u.name, u.email)}</strong><small>{u.email}</small></span></span>
                <span><Chip tone={STATUS_TONE[u.status]}>{STATUS_LABEL[u.status]}</Chip></span>
                <span className="ad-fam">
                  {w ? <span><strong>{w.day}</strong><small>às {w.time} · {u.last_by === 'crianca' ? 'criança' : 'responsável'}</small></span> : <span className="ad-when">—</span>}
                </span>
                <span><Chip tone={awayTone(u.away)}>{awayLabel(u.away)}</Chip></span>
                <span>{u.days30} de 30</span>
              </Link>
            );
          })}
        </div>
        {shown.length > LIST_MAX && <p className="ad-sub">Mostrando {LIST_MAX} de {fmtInt(shown.length)}. Use os filtros para ver as demais.</p>}
      </section>
    </div>
  );
}
