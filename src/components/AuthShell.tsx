import Link from 'next/link'
import TfIcon from '@/components/TfIcon'

// Moldura das telas de acesso (login, cadastro, senha, e-mail, telefone) com a identidade do Tarefinha:
// fundo laranja da marca com os ícones da página inicial, logo no topo e o cartão com um ícone em cima.

const STICKERS = [
  { icon: 'vassoura', size: 84, pos: 'left-[6%] top-[18%]', r: -14 },
  { icon: 'cama', size: 72, pos: 'left-[10%] top-[58%]', r: 10 },
  { icon: 'pata', size: 60, pos: 'left-[4%] bottom-[10%]', r: -8 },
  { icon: 'sorvete', size: 80, pos: 'right-[7%] top-[16%]', r: 12 },
  { icon: 'escova', size: 70, pos: 'right-[11%] top-[55%]', r: -10 },
  { icon: 'videogame', size: 72, pos: 'right-[5%] bottom-[10%]', r: 8 },
  { icon: 'estrela', size: 52, pos: 'left-[20%] top-[8%]', r: 16 },
  { icon: 'brilho', size: 48, pos: 'right-[22%] top-[9%]', r: 0 },
]

export default function AuthShell({
  title,
  subtitle,
  icon = 'estrela',
  children,
}: {
  title: string
  subtitle?: React.ReactNode
  icon?: string
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-brand text-ink flex flex-col">
      {STICKERS.map((s) => (
        <span
          key={s.icon}
          aria-hidden="true"
          className={`absolute hidden lg:block leading-none opacity-95 ${s.pos}`}
          style={{ transform: `rotate(${s.r}deg)` }}
        >
          <TfIcon name={s.icon} size={s.size} style={{ ['--ic-b' as string]: '#8a2e06', ['--ic-border' as string]: '#fff8ef' }} />
        </span>
      ))}

      <header className="relative z-10 flex justify-center px-5 pt-8 pb-4">
        <Link href="/" aria-label="Tarefinha: página inicial">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/tarefinha-horizontal-escuro.svg" alt="Tarefinha" className="h-10 md:h-12 w-auto" />
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex items-start md:items-center justify-center px-4 pt-10 pb-10">
        <div className="relative max-w-md w-full bg-surface-raised px-7 pt-14 pb-8 md:px-9 rounded-[32px] shadow-[0_6px_0_rgba(58,42,34,.18),0_24px_48px_rgba(58,42,34,.25)]">
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 grid place-items-center size-20 rounded-full bg-sun border-[5px] border-surface-raised shadow-sticker">
            <TfIcon name={icon} size={46} />
          </span>
          <h1 className="font-display font-bold text-[32px] leading-tight text-center text-ink">{title}</h1>
          {subtitle && <p className="mt-2 mb-7 text-center text-ink-muted leading-normal">{subtitle}</p>}
          {!subtitle && <div className="mb-7" />}
          {children}
        </div>
      </main>

      <footer className="relative z-10 pb-6 text-center text-sm font-bold text-[#ffe6d8]">
        <p>Arrumou a cama? Ganhou ponto.</p>
        <Link href="/privacidade" className="mt-1 inline-block min-h-8 underline underline-offset-4">
          Privacidade
        </Link>
      </footer>
    </div>
  )
}
