import React from 'react';

export type Tone = 'ok' | 'wait' | 'bad' | 'off' | 'canceled';

export function Chip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={`ad-chip ad-chip--${tone}`}>{children}</span>;
}

export function Kpi({ label, value, chip, tone }: { label: string; value: React.ReactNode; chip?: string; tone?: Tone }) {
  return (
    <div className="tf-card ad-kpi">
      <div className="ad-kpi__label">{label}</div>
      <div className="ad-kpi__value">{value}</div>
      {chip && <Chip tone={tone ?? 'off'}>{chip}</Chip>}
    </div>
  );
}

export const fmtInt = (v: number) => v.toLocaleString('pt-BR');
export const fmtDec = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const fmtDM = (iso: string) => {
  const [, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}`;
};
