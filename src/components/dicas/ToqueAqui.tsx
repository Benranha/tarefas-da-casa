'use client'
import { useRef, useState } from 'react'
import { TOQUE_AQUI, useDica, useDispensarAoTocar, type AreaDica, type ToqueAquiId } from '@/lib/dicas'

// Balão "toque aqui". Vai DENTRO do elemento que ele aponta (botão, link, cartão), que precisa de
// position: relative. Fica por cima, sem pegar o toque: tocar no elemento funciona como sempre e
// faz o balão sumir. O texto é só visual (aria-hidden): quem usa leitor de tela já tem o rótulo do botão.
//
// O balão só aparece com o alvo na tela. "fixo" é para alvos dentro de uma barra fixa (a pílula do
// celular), que estão sempre à vista. Os demais precisam estar longe das bordas da tela, para o balão
// caber e não ficar sob a pílula. Em alvos grandes (o cartão de uma tarefa na tela da criança) use
// lado="dentro": o balão fica no canto do próprio alvo, que precisa estar quase todo na tela.
export default function ToqueAqui({
  id,
  prioridade = 10,
  lado = 'cima',
  alinhar = 'centro',
  quando = true,
  fixo = false,
  area = 'pais',
}: {
  id: ToqueAquiId
  prioridade?: number
  lado?: 'cima' | 'baixo' | 'dentro'
  alinhar?: 'inicio' | 'centro' | 'fim'
  quando?: boolean
  fixo?: boolean
  area?: AreaDica
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [alvo, setAlvo] = useState<HTMLElement | null>(null)
  const margem = fixo ? '0px' : lado === 'baixo' ? '0px 0px -190px 0px' : lado === 'cima' ? '-100px 0px -100px 0px' : '-40px 0px -40px 0px'
  const minimo = lado === 'dentro' ? 0.9 : 0.55
  const { visivel, dispensar } = useDica({ id, tipo: 'toque', prioridade, quando, area, alvo: ref, margem, minimo })
  useDispensarAoTocar(alvo, visivel, dispensar)

  return (
    <span
      ref={(el) => {
        ref.current = el
        setAlvo(el?.parentElement ?? null)
      }}
      className="tf-dica"
      data-lado={lado}
      data-alinhar={lado === 'dentro' ? 'nenhum' : alinhar}
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
