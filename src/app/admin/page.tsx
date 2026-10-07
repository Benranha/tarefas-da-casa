import Link from 'next/link';
import { overview, parsePeriod, PERIODS, brl, pct } from '@/lib/admin';
import { Kpi, fmtInt, fmtDec, fmtDM } from './ui';

const FUNNEL = [
  'Criou a conta',
  'Cadastrou a 1ª criança',
  'Criou a 1ª tarefa',
  'Marcou a 1ª tarefa como feita',
  'Teve a 1ª tarefa aprovada',
  'Virou assinante',
];
const CONVERSION_GOAL = 35;

export default async function AdminOverview({ searchParams }: PageProps<'/admin'>) {
  const raw = (await searchParams).p;
  const period = parsePeriod(typeof raw === 'string' ? raw : undefined);
  const { kpi, daily, funnel, alerts } = await overview(period);

  const today = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone: 'America/Manaus' }).format(new Date());
  const max = Math.max(1, ...daily.map((d) => d.total));
  const every = period === 7 ? 1 : period === 30 ? 5 : 15;
  const wide = period === 90;

  const items: { n: number; text: string; href: string; cta: string; tone: 'wait' | 'bad' | 'off' }[] = [
    { n: kpi.trialExpiring, text: 'testes grátis vencem nos próximos 7 dias', href: '/admin/assinantes?status=trialing&vence=7d', cta: 'Ver lista', tone: 'wait' },
    { n: kpi.pastDue, text: 'pagamentos recusados para tentar de novo', href: '/admin/assinantes?status=past_due', cta: 'Resolver', tone: 'bad' },
    { n: alerts.silentPaying, text: 'famílias pagantes sem tarefa aprovada há 7+ dias', href: '/admin/assinantes?status=active', cta: 'Reengajar', tone: 'off' },
    { n: alerts.locked, text: 'crianças com código bloqueado por tentativas', href: '/admin/assinantes', cta: 'Ver', tone: 'off' },
  ];

  return (
    <div className="ad-page">
      <header className="ad-head">
        <div>
          <h1 className="ad-h1">Visão geral</h1>
          <p className="ad-sub">Hoje, {today} · fuso America/Manaus</p>
        </div>
        <div className="ad-seg" role="group" aria-label="Período">
          {PERIODS.map((p) => (
            <Link key={p} href={`/admin?p=${p}`} data-active={p === period || undefined} aria-current={p === period ? 'true' : undefined}>
              {p} dias
            </Link>
          ))}
        </div>
      </header>

      <section className="ad-grid4" aria-label="Indicadores">
        <Kpi label="Assinantes pagantes" value={fmtInt(kpi.paying)} chip={`+${fmtInt(kpi.payingNew)} no mês`} tone="ok" />
        <Kpi label="Em teste grátis" value={fmtInt(kpi.trialing)} chip={`${fmtInt(kpi.trialExpiring)} vencem em 7 dias`} tone="wait" />
        <Kpi label="Receita mensal (MRR)" value={brl(kpi.mrrCents)} chip={`+${brl(kpi.mrrNewCents)} no mês`} tone="ok" />
        <Kpi label="Conversão teste → pago" value={`${kpi.convPct}%`} chip={`meta ${CONVERSION_GOAL}%`} tone={kpi.convPct >= CONVERSION_GOAL ? 'ok' : 'wait'} />
        <Kpi label="Cancelamento mensal" value={`${kpi.churnPct.toLocaleString('pt-BR')}%`} chip={`${fmtInt(kpi.churned)} ${kpi.churned === 1 ? 'família' : 'famílias'}`} tone="bad" />
        <Kpi label="Famílias ativas (7 dias)" value={fmtInt(kpi.activeFamilies)} chip={`${kpi.activePct}% da base`} tone="ok" />
        <Kpi label="Aprovação das tarefas" value={`${kpi.approvalPct}%`} chip={`${kpi.rejectedPct}% devolvidas`} />
        <Kpi label="Tempo até aprovar" value={kpi.medianMin == null ? '—' : `${fmtInt(kpi.medianMin)} min`} chip="mediana" />
      </section>

      <section className="tf-card ad-card">
        <div className="ad-card__head">
          <div>
            <h2 className="ad-h2">Tarefas aprovadas por dia</h2>
            <p className="ad-sub">Toda a plataforma · últimos {period} dias</p>
          </div>
          <div className="ad-mini">
            {[
              ['Média/dia', fmtDec(kpi.perDay)],
              ['Por família ativa', fmtDec(kpi.perFamily)],
              ['Por criança', fmtDec(kpi.perChild)],
            ].map(([l, v]) => (
              <div key={l}><span>{l}</span><strong>{v}</strong></div>
            ))}
          </div>
        </div>
        <div className="ad-bars" data-wide={wide || undefined} role="img" aria-label={`Tarefas aprovadas por dia nos últimos ${period} dias`}>
          {daily.map((d) => {
            const dow = new Date(d.day + 'T12:00:00Z').getUTCDay();
            return (
              <div key={d.day} className="ad-bars__col" title={`${fmtDM(d.day)}: ${d.total}`}>
                <div className="ad-bars__bar" data-weekend={dow === 0 || dow === 6 || undefined} style={{ height: `${(d.total / max) * 100}%` }} />
              </div>
            );
          })}
        </div>
        <div className="ad-bars__labels" data-wide={wide || undefined}>
          {daily.map((d, i) => (
            <span key={d.day}>{(daily.length - 1 - i) % every === 0 ? fmtDM(d.day) : ''}</span>
          ))}
        </div>
        <div className="ad-legend"><i style={{ background: 'var(--brand)' }} /> Dias úteis <i style={{ background: 'var(--sun)' }} /> Fim de semana</div>
      </section>

      <section className="ad-row2">
        <div className="tf-card ad-card">
          <h2 className="ad-h2">Funil de ativação</h2>
          <p className="ad-sub">Famílias cadastradas nos últimos 30 dias</p>
          <div className="ad-funnel">
            {FUNNEL.map((label, i) => (
              <div key={label}>
                <div className="ad-funnel__row"><span>{label}</span><strong>{fmtInt(funnel[i])} · {pct(funnel[i], funnel[0])}%</strong></div>
                <div className="ad-track"><div className="ad-fill" data-last={i === FUNNEL.length - 1 || undefined} style={{ width: `${pct(funnel[i], funnel[0])}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="tf-card ad-card">
          <h2 className="ad-h2">Precisa de você</h2>
          <div className="ad-alerts">
            {items.map((a) => (
              <div key={a.text} className={`ad-alert ad-alert--${a.tone}`}>
                <strong>{fmtInt(a.n)}</strong>
                <div>
                  <p>{a.text}</p>
                  <Link href={a.href}>{a.cta}</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
