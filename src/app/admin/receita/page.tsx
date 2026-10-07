import { revenue, brl } from '@/lib/admin';
import { Kpi, fmtInt } from '../ui';

export default async function AdminRevenue() {
  const r = await revenue();
  return (
    <div className="ad-page">
      <header className="ad-head"><div><h1 className="ad-h1">Receita</h1><p className="ad-sub">Resumo da cobrança. Os gráficos de receita ainda não foram desenhados.</p></div></header>
      <section className="ad-grid4" aria-label="Indicadores">
        <Kpi label="Receita mensal (MRR)" value={brl(r.mrr)} chip={`${fmtInt(r.active)} pagantes`} tone="ok" />
        <Kpi label="Em risco (atrasados)" value={brl(r.atRisk)} chip={`${fmtInt(r.pastDue)} famílias`} tone="bad" />
        <Kpi label="Cancelados" value={fmtInt(r.canceled)} chip="desde o início" tone="canceled" />
      </section>
    </div>
  );
}
