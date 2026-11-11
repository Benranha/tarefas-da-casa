'use client'
import { useRef, useState } from 'react'
import { TOQUE_AQUI, useDica, useDispensarAoTocar, type ToqueAquiId } from '@/lib/dicas'

// Balão "toque aqui". Vai DENTRO do elemento que ele aponta (botão, link, cartão), que precisa de
// position: relative. Fica por cima, sem pegar o toque: tocar no elemento funciona como sempre e
// faz o balão sumir. O texto é só visual (aria-hidden): quem usa leitor de tela já tem o rótulo do botão.
//
// O balão só aparece com o alvo na tela. "fixo" é para alvos dentro de uma barra fixa (a pílula do
// celular), que estão sempre à vista. Os demais precisam estar longe das bordas da tela, para o balão
// caber e não ficar sob a pílula.
export default function ToqueAqui({
  id,
  prioridade = 10,
  lado = 'cima',
  alinhar = 'centro',
  quando = true,
  fixo = false,
}: {
  id: ToqueAquiId
  prioridade?: number
  lado?: 'cima' | 'baixo'
  alinhar?: 'inicio' | 'centro' | 'fim'
  quando?: boolean
  fixo?: boolean
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [alvo, setAlvo] = useState<HTMLElement | null>(null)
  const margem = fixo ? '0px' : lado === 'baixo' ? '0px 0px -190px 0px' : '-100px 0px -100px 0px'
  const { visivel, dispensar } = useDica(id, 'toque', prioridade, quando, ref, margem)
  useDispensarAoTocar(alvo, visivel, dispensar)

  return (
    <span
      ref={(el) => {
        ref.current = el
        setAlvo(el?.parentElement ?? null)
      }}
      className="tf-dica"
      data-lado={lado}
      data-alinhar={alinhar}
      aria-hidden="true"
    >
      {visivel && (
        <>
          <span className="tf-dica__anel" />
          <span className="tf-dica__balao">{TOQUE_AQUI[id]}</span>
        </>
      )}
    </span>
  )
}
