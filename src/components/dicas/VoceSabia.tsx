'use client'
import Link from 'next/link'
import { Lightbulb, X } from 'lucide-react'
import { VOCE_SABIA, definirDicas, useDica, type VoceSabiaId } from '@/lib/dicas'

type Acao = { rotulo: string; href?: string; onClick?: () => void }

// Cartão "Você sabia?": uma ideia, um botão de ação opcional e a saída para quem não quer dicas.
// Só aparece quando for a vez dele (ver src/lib/dicas.ts). "quando" deixa a tela decidir se a dica
// faz sentido (por exemplo, só com 2 ou mais crianças).
export default function VoceSabia({
  id,
  prioridade = 10,
  quando = true,
  acao,
  className = '',
}: {
  id: VoceSabiaId
  prioridade?: number
  quando?: boolean
  acao?: Acao
  className?: string
}) {
  const { visivel, dispensar } = useDica(id, 'sabia', prioridade, quando)
  if (!visivel) return null

  const botao = '!text-[15px] !px-[18px] !min-h-[44px]'
  return (
    <aside aria-label="Dica" className={`tf-card relative !bg-sun-soft !py-4 !pl-5 !pr-12 text-ink ${className}`}>
      <button type="button" onClick={dispensar} aria-label="Fechar dica" className="absolute right-2 top-2 p-2 rounded-full hover:bg-surface-sunken">
        <X size={18} />
      </button>
      <p className="flex items-center gap-2 font-extrabold text-[15px] leading-5">
        <Lightbulb size={18} aria-hidden /> Você sabia?
      </p>
      <p className="mt-1 text-[14px] leading-5 text-ink-muted">{VOCE_SABIA[id].texto}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        {acao?.href && (
          <Link href={acao.href} onClick={dispensar} className={`tf-btn tf-btn--primary ${botao}`}>
            {acao.rotulo}
          </Link>
        )}
        {acao && !acao.href && (
          <button
            type="button"
            onClick={() => {
              acao.onClick?.()
              dispensar()
            }}
            className={`tf-btn tf-btn--primary ${botao}`}
          >
            {acao.rotulo}
          </button>
        )}
        <button type="button" onClick={() => definirDicas(false)} className="min-h-[44px] text-[13px] font-bold text-ink-muted underline">
          Parar de mostrar dicas
        </button>
      </div>
    </aside>
  )
}
