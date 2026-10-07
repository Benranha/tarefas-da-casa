import React from 'react';
import { engagement } from '@/lib/admin';
import { Kpi, fmtInt, fmtDec } from '../ui';

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7);
const WEEKS = [1, 2, 3, 4, 6, 8];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export default async function AdminEngagement() {
  const { kpi, heat, cohorts, resources } = await engagement();
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
    </div>
  );
}
