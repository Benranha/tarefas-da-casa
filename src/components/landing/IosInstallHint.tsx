'use client'
import { useEffect, useState } from 'react'

/** No iPhone/iPad não há prompt de instalação: mostra o passo a passo manual do Safari. */
export default function IosInstallHint() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const ios =
      /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setShow(ios && !standalone)
  }, [])

  if (!show) return null

  return (
    <div className="w-full max-w-[560px] rounded-3xl bg-[#fff8ef]/15 p-5 text-left">
      <p className="font-display font-bold text-xl">Como instalar no iPhone</p>
      <ol className="mt-2 list-decimal pl-5 space-y-1 font-bold leading-normal">
        <li>Abra esta página no <strong>Safari</strong>. Se veio por um link do WhatsApp ou Instagram, toque em “Abrir no Safari”.</li>
        <li>Toque no botão <strong>Compartilhar</strong> (quadrado com a seta para cima).</li>
        <li>Role a lista de ações e toque em <strong>Adicionar à Tela de Início</strong>. Não achou? Toque em <strong>Mais</strong> (três pontinhos) no fim do menu.</li>
        <li>Toque em <strong>Adicionar</strong>. O ícone do Tarefinha aparece na tela inicial.</li>
      </ol>
      <p className="mt-3 text-sm font-bold leading-normal">
        Ainda não aparece? Role o menu até o fim, toque em <strong>Editar Ações</strong> e ative “Adicionar à Tela de Início”.
      </p>
    </div>
  )
}
