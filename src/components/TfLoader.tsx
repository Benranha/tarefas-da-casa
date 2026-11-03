import type { CSSProperties } from 'react'

/**
 * Ícone de carregamento do Tarefinha: a casinha do símbolo quica, o check se desenha e a estrela estoura.
 * O movimento fica no CSS (`.tf-load` em tarefinha.css) e usa só transform e opacidade.
 * `tone="on-brand"` é para dentro de botões tangerina. Dentro de botão, passe `decorative` (o texto já avisa).
 */
export function TfLoader({
  size = 48,
  tone = 'default',
  decorative = false,
  label = 'Carregando',
  className,
}: {
  size?: number
  tone?: 'default' | 'on-brand'
  decorative?: boolean
  label?: string
  className?: string
}) {
  const house = 'M60 12 L104 50 V96 a10 10 0 0 1 -10 10 H26 a10 10 0 0 1 -10 -10 V50 Z'
  const star = 'M98 6 L102.4 15 L112.4 16.4 L105.2 23.4 L107 33.4 L98 28.6 L89 33.4 L90.8 23.4 L83.6 16.4 L93.6 15 Z'
  const a11y = decorative ? { 'aria-hidden': true as const } : { role: 'img' as const, 'aria-label': label }
  return (
    <span
      className={`tf-load${tone === 'on-brand' ? ' tf-load--on-brand' : ''}${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size } as CSSProperties}
      {...a11y}
    >
      <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden="true">
        <ellipse className="tf-load__ground" cx="60" cy="113" rx="30" ry="4.5" />
        <g className="tf-load__house">
          <path d={house} transform="translate(0 4)" className="tf-load__sticker" strokeWidth="11" strokeLinejoin="round" />
          <path d={house} className="tf-load__border" strokeWidth="11" strokeLinejoin="round" />
          <path d={house} className="tf-load__fill" strokeWidth="2" strokeLinejoin="round" />
          <path className="tf-load__check" d="M41 70 L55 84 L81 55" fill="none" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" pathLength="100" />
        </g>
        <g className="tf-load__star">
          <path d={star} className="tf-load__border" strokeWidth="7" strokeLinejoin="round" />
          <path d={star} fill="#FFC93C" stroke="#FFC93C" strokeWidth="2" strokeLinejoin="round" />
        </g>
      </svg>
    </span>
  )
}

/** Tela de carregamento: o ícone grande, uma frase curta e as três bolinhas das crianças. */
export function TfLoading({ text = 'Carregando…', size = 120, className }: { text?: string; size?: number; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 text-center${className ? ` ${className}` : ''}`} role="status" aria-live="polite">
      <TfLoader size={size} decorative />
      <p className="font-display text-xl font-semibold text-ink">{text}</p>
      <span className="tf-load__dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </div>
  )
}
