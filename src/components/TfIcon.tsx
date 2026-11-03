import type { CSSProperties } from 'react'
import { TF_DEFS, TF_FROM_EMOJI, type TfIconDef } from '@/lib/tf-icons-data'


/** Emoji escolhido pelos pais que não é um dos ícones próprios nem um emoji antigo mapeado. */
export function isCustomEmoji(name: string | null | undefined): name is string {
  return !!name && name.length <= 16 && !TF_DEFS[name] && !TF_FROM_EMOJI[name] && /\p{Extended_Pictographic}/u.test(name)
}

export function resolveIcon(name: string | null | undefined): { key: string; def: TfIconDef } {
  const n = name ?? ''
  const key = TF_DEFS[n] ? n : TF_FROM_EMOJI[n] ?? 'brilho'
  return { key, def: TF_DEFS[key] ?? TF_DEFS.brilho }
}

function markup(def: TfIconDef, flat: boolean) {
  const base = def.b.replaceAll('{L}', '4')
  const wide = def.b.replaceAll('{L}', '9')
  const layer = (cls: string, sw: number, shapes: string, extra = '') =>
    `<g class="${cls}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round" ${extra}>${shapes}</g>`
  const body =
    (flat ? '' : layer('s', 5, wide, 'opacity=".16" transform="translate(0 2.2)"') + layer('w', 5, wide)) +
    layer('f', 0, base) +
    def.d
  return `<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true"><g${def.t ? ` transform="${def.t}"` : ''}>${body}</g></svg>`
}

function varsToStyle(vars?: string): CSSProperties {
  const style: Record<string, string> = {}
  vars?.split(';').forEach((p) => {
    const i = p.indexOf(':')
    if (i > 0) style[p.slice(0, i).trim()] = p.slice(i + 1).trim()
  })
  return style as CSSProperties
}

/** Ícone próprio do Tarefinha. `name` aceita o nome do ícone ou o emoji antigo salvo no banco. */
export default function TfIcon({
  name,
  size = 24,
  flat = false,
  color,
  style,
  className,
  'aria-label': ariaLabel,
}: {
  name: string | null | undefined
  size?: number | string
  flat?: boolean
  /** Cor de preenchimento (--ic-b), ex.: a cor da criança nos avatares. */
  color?: string
  style?: CSSProperties
  className?: string
  'aria-label'?: string
}) {
  const px = typeof size === 'number' ? `${size}px` : size
  // Emoji livre (coisas bem específicas, como "arrumar a cafeteira"): aparece como está.
  if (isCustomEmoji(name)) {
    return (
      <span
        className={`tf-ic${className ? ` ${className}` : ''}`}
        role="img"
        aria-label={ariaLabel ?? 'Ícone'}
        style={{ width: px, height: px, display: 'inline-grid', placeItems: 'center', fontSize: `calc(${px} * 0.78)`, lineHeight: 1, ...style }}
      >
        {name}
      </span>
    )
  }
  const { def } = resolveIcon(name)
  return (
    <span
      className={`tf-ic${className ? ` ${className}` : ''}`}
      role="img"
      aria-label={ariaLabel ?? def.label}
      style={{ width: px, height: px, ...varsToStyle(def.vars), ...(color ? { ['--ic-b' as string]: color } : null), ...style }}
      dangerouslySetInnerHTML={{ __html: markup(def, flat) }}
    />
  )
}
