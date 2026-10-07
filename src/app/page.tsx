import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/server'
import TfIcon from '@/components/TfIcon'
import InstallButton from '@/components/landing/InstallButton'

export const dynamic = 'force-dynamic'

const STICKERS = [
  { icon: 'vassoura', size: 96, pos: 'left-[5%] top-[130px]', r: -14 },
  { icon: 'cama', size: 84, pos: 'left-[12%] top-[310px]', r: 10, wide: true },
  { icon: 'pata', size: 72, pos: 'left-[3%] top-[450px]', r: -8, wide: true },
  { icon: 'sorvete', size: 88, pos: 'right-[8%] top-[120px]', r: 12 },
  { icon: 'escova', size: 80, pos: 'right-[4%] top-[300px]', r: -10, wide: true },
  { icon: 'videogame', size: 84, pos: 'right-[7%] top-[450px]', r: 8, wide: true },
  { icon: 'estrela', size: 60, pos: 'left-[22%] top-[100px]', r: 16, wide: true },
  { icon: 'brilho', size: 56, pos: 'right-[24%] top-[250px]', r: 0, wide: true },
]

type TaskState = 'approved' | 'waiting' | 'pending'
const TASKS: { icon: string; title: string; points: number; st: TaskState }[] = [
  { icon: 'pata', title: 'Dar comida ao Totó', points: 15, st: 'approved' },
  { icon: 'louca', title: 'Lavar a louça', points: 10, st: 'waiting' },
  { icon: 'brinquedos', title: 'Guardar brinquedos', points: 10, st: 'pending' },
  { icon: 'planta', title: 'Regar as plantas', points: 5, st: 'pending' },
]
const TASK_LABEL: Record<TaskState, string> = {
  approved: 'Aprovado!',
  waiting: 'Aguardando papais...',
  pending: 'Toque quando terminar',
}

const STEPS = [
  { icon: 'menina', color: '#2f5bea', title: 'Cadastre as crianças', body: 'Nome, avatar, cor e os horários de acordar e dormir de cada uma.' },
  { icon: 'vassoura', color: undefined, title: 'Crie as tarefas do dia', body: 'Escolha o ícone, os pontos e, se quiser, um horário. Elas se repetem todos os dias.' },
  { icon: 'estrela', color: undefined, title: 'Elas marcam, você aprova', body: 'Cada aprovação vira ponto. Os pontos viram sorvete, cinema ou o que vocês combinarem.' },
]

const FEATURES = [
  {
    kicker: 'Totem no tablet',
    title: 'O quadro de tarefas da família, na parede',
    body: 'Cada criança toca no próprio rosto, digita o código secreto e vê só as tarefas dela. Ícones grandes, para quem ainda está aprendendo a ler.',
    kid: 'azul',
    items: [
      { icon: 'brinquedos', text: 'Tarefas grandes, fáceis de tocar' },
      { icon: 'festa', text: 'Confete quando os pais aprovam' },
      { icon: 'presente', text: 'Troca de pontos por prêmios ali mesmo' },
    ],
  },
  {
    kicker: 'App da criança',
    title: 'Tem celular? A tarefa avisa na hora',
    body: 'Mande um link só dela. Instalado como app, ele lembra cada tarefa no horário marcado — só entre a hora de acordar e a de dormir.',
    kid: 'rosa',
    items: [
      { icon: 'escova', text: '“Hora da tarefa! Escovar os dentes”' },
      { icon: 'lapis', text: 'Marca como feita no próprio aparelho' },
      { icon: 'bebe', text: 'Respeita o horário de dormir' },
    ],
  },
  {
    kicker: 'Para os pais',
    title: 'Ponto só vale depois do seu ok',
    body: 'Cada tarefa marcada cai na sua fila. Aprove com um toque ou devolva com um recado, e ela refaz. Convide o outro responsável para dividir.',
    kid: 'verde',
    items: [
      { icon: 'estrela', text: 'Aprovar com um toque' },
      { icon: 'recado', text: 'Devolver com recado' },
      { icon: 'menino', text: 'Duas pessoas na mesma família' },
    ],
  },
]

const FAQ = [
  { q: 'É grátis mesmo?', a: 'Sim. Durante a fase de teste o Tarefinha é totalmente gratuito, sem cartão de crédito.' },
  { q: 'Preciso baixar em alguma loja?', a: 'Não. O Tarefinha é um app web (PWA): você abre o link no navegador e toca em “Instalar app” (Android) ou “Adicionar à Tela de Início” (iPhone). Ele passa a abrir como um app normal.' },
  { q: 'Meus filhos precisam de celular?', a: 'Não. Um tablet da casa vira o totem da família. O celular da criança é opcional — serve para ela receber lembretes no horário.' },
  { q: 'Como cada criança entra?', a: 'Na primeira vez ela escolhe um código secreto de 4 a 8 números. Sem ele, ninguém mexe nas tarefas dela. Os pais podem redefinir quando quiserem.' },
  { q: 'Dá para dividir com o outro responsável?', a: 'Sim. Em Família você gera um convite e os dois passam a aprovar tarefas e cuidar das recompensas juntos.' },
  { q: 'Que tablet eu preciso?', a: 'Qualquer tablet com um navegador atualizado. Para deixar a tela sempre ligada, recomendamos o modo quiosque (Fully Kiosk Browser no Android).' },
]

const CTA_BASE =
  'inline-flex items-center justify-center min-h-16 px-9 rounded-full font-display font-semibold text-2xl'
const CTA_SUN = `${CTA_BASE} bg-sun text-on-sun shadow-[0_6px_0_rgba(58,42,34,.3)] active:translate-y-0.5 active:shadow-none`

export default async function Home() {
  const { data: session } = await auth.getSession()
  if (session?.user) redirect('/pais')

  return (
    <div className="bg-surface text-ink font-sans">
      {/* Hero */}
      <div className="relative overflow-hidden bg-brand text-[#fff8ef]">
        <nav className="relative z-10 flex items-center justify-between px-5 md:px-16 py-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/tarefinha-horizontal-escuro.svg" alt="Tarefinha" className="h-10 w-auto" />
          <div className="flex items-center gap-4 md:gap-8 font-extrabold whitespace-nowrap">
            <a href="#como" className="hidden md:inline">Como funciona</a>
            <a href="#faq" className="hidden md:inline">Perguntas</a>
            <Link href="/login" className="hidden md:inline-flex items-center min-h-12 px-6 border-2 border-[#fff8ef] rounded-full">
              Entrar
            </Link>
            <InstallButton className="md:hidden inline-flex items-center min-h-11 px-5 rounded-full bg-sun text-on-sun">
              Instalar
            </InstallButton>
          </div>
        </nav>

        {STICKERS.map((s) => (
          <span
            key={s.icon}
            aria-hidden="true"
            className={`absolute leading-none opacity-95 ${s.pos} ${s.wide ? 'hidden lg:block' : 'hidden md:block'}`}
            style={{ transform: `rotate(${s.r}deg)` }}
          >
            <TfIcon
              name={s.icon}
              size={s.size}
              style={{ ['--ic-b' as string]: '#8a2e06', ['--ic-border' as string]: '#fff8ef' }}
            />
          </span>
        ))}

        <header className="relative z-10 flex flex-col items-center text-center gap-7 px-5 md:px-16 pt-10 md:pt-16 pb-44 md:pb-[220px]">
          <span className="inline-flex items-center rounded-full bg-sun text-on-sun px-[18px] py-2.5 text-[15px] font-extrabold shadow-[0_3px_0_rgba(58,42,34,.25)]">
            Grátis na fase de teste
          </span>
          <h1 className="max-w-[900px] font-display font-bold text-[52px] md:text-[84px] leading-none tracking-[-0.01em] text-balance">
            Arrumou a cama? Ganhou ponto.
          </h1>
          <p className="max-w-[620px] text-lg md:text-[21px] font-bold leading-normal text-pretty">
            O Tarefinha transforma as tarefas de casa em um jogo: as crianças marcam, os pais aprovam e os pontos viram recompensas.
          </p>
          <div className="flex flex-wrap justify-center gap-3.5">
            <InstallButton className={CTA_SUN}>Instalar grátis</InstallButton>
            <a
              href="#como"
              className={`${CTA_BASE} px-8 border-[3px] border-[#fff8ef] text-[#fff8ef]`}
            >
              Ver como funciona
            </a>
          </div>
        </header>
      </div>

      {/* Tablet sobreposto */}
      <div className="relative z-20 mx-4 md:mx-auto md:w-[min(960px,calc(100%-32px))] -mt-32 md:-mt-[180px] rounded-[32px] md:rounded-[44px] bg-ink p-3 md:p-[18px] shadow-[0_6px_0_rgba(58,42,34,.14),0_24px_48px_rgba(58,42,34,.25)]">
        <div className="overflow-hidden rounded-[22px] md:rounded-[28px] bg-surface">
          <div className="flex items-center justify-between gap-3 px-4 md:px-8 py-4 md:py-5 bg-[var(--kid-verde-soft)]">
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
              <span className="grid place-items-center shrink-0 size-14 md:size-[72px] rounded-full bg-white border-[5px] border-[var(--kid-verde)]">
                <span className="md:hidden"><TfIcon name="cacheado" size={40} color="var(--kid-verde)" /></span>
                <span className="hidden md:block"><TfIcon name="cacheado" size={48} color="var(--kid-verde)" /></span>
              </span>
              <div className="min-w-0">
                <p className="font-display font-semibold text-2xl md:text-[30px] leading-tight">Oi, Theo!</p>
                <p className="text-sm md:text-base font-bold text-ink-muted">Minhas tarefas de hoje</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="grid place-items-center size-12 md:size-16 rounded-full bg-sun shadow-sticker">
                <TfIcon name="estrela" size={32} flat style={{ ['--ic-star' as string]: '#fff8ef' }} />
              </span>
              <div>
                <div className="font-display font-bold text-4xl md:text-5xl leading-none">150</div>
                <div className="text-sm font-bold text-ink-muted">pontos</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-[18px] px-4 md:px-8 pt-6 pb-6 md:pb-8">
            {TASKS.map((t) => (
              <div
                key={t.title}
                className={`tf-task !flex-col !items-stretch !gap-3 !p-4 md:!p-5 !border-[3px] !rounded-[24px] !shadow-pop ${
                  t.st === 'approved' ? 'tf-task--approved' : t.st === 'waiting' ? 'tf-task--waiting' : ''
                }`}
              >
                <span className="flex items-center justify-between">
                  <span className="tf-task__icon !size-14 md:!size-[68px] !rounded-[18px]">
                    <TfIcon name={t.icon} size={46} />
                  </span>
                  <span className={`tf-task__pts !text-base md:!text-xl ${t.st === 'pending' ? '' : '!bg-white'}`}>+{t.points}</span>
                </span>
                <span className="font-display font-semibold text-[19px] leading-tight">{t.title}</span>
                <span className="tf-task__status !text-[13px] md:!text-[15px]">{TASK_LABEL[t.st]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Como funciona */}
      <section id="como" className="flex flex-col items-center gap-14 px-5 md:px-16 pt-24 md:pt-[120px] pb-24">
        <h2 className="font-display font-bold text-[40px] md:text-[52px] leading-[1.1] text-center">Como funciona</h2>
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10 w-full">
          <div aria-hidden="true" className="hidden md:block absolute top-[72px] left-[16%] right-[16%] border-t-4 border-dashed border-pending-border" />
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative flex flex-col items-center text-center gap-[18px]">
              <span className="grid place-items-center size-36 rounded-full bg-surface-raised border-[3px] border-line shadow-pop">
                <TfIcon name={s.icon} size={88} color={s.color} />
              </span>
              <span className="font-display font-bold text-lg leading-none text-brand-ink">Passo {i + 1}</span>
              <h3 className="font-display font-semibold text-[30px] leading-[1.15]">{s.title}</h3>
              <p className="max-w-80 text-[17px] leading-[1.55] text-ink-muted text-pretty">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Faixas de recurso */}
      <section className="flex flex-col gap-6 px-5 md:px-16 pb-24">
        {FEATURES.map((f) => (
          <div
            key={f.kicker}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center rounded-[32px] p-7 md:p-14"
            style={{ background: `var(--kid-${f.kid}-soft)` }}
          >
            <div className="flex flex-col gap-4">
              <span
                className="self-start rounded-full px-3.5 py-2 text-sm font-extrabold leading-none text-white"
                style={{ background: `var(--kid-${f.kid})` }}
              >
                {f.kicker}
              </span>
              <h2 className="font-display font-bold text-[32px] md:text-[42px] leading-[1.1] text-balance">{f.title}</h2>
              <p className="text-lg leading-[1.55] text-pretty">{f.body}</p>
            </div>
            <div className="flex flex-col gap-3.5">
              {f.items.map((it) => (
                <div key={it.text} className="flex items-center gap-4 bg-white rounded-[24px] px-5 py-4 shadow-sticker">
                  <TfIcon name={it.icon} size={44} color={`var(--kid-${f.kid})`} />
                  <span className="font-extrabold text-[17px] leading-[1.4]">{it.text}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* FAQ */}
      <section id="faq" className="flex flex-col gap-10 px-5 md:px-16 py-24 bg-surface-raised border-t-2 border-line">
        <h2 className="font-display font-bold text-[40px] md:text-[52px] leading-[1.1] text-center">Perguntas frequentes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FAQ.map((f) => (
            <div key={f.q} className="flex flex-col gap-2.5 bg-surface border-2 border-line rounded-[24px] px-7 py-6">
              <h3 className="font-display font-semibold text-[22px] leading-tight">{f.q}</h3>
              <p className="leading-[1.6] text-ink-muted text-pretty">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section id="instalar" className="flex flex-col items-center text-center gap-7 px-5 md:px-16 py-[88px] bg-brand text-[#fff8ef]">
        <TfIcon name="festa" size={96} style={{ ['--ic-b' as string]: '#ffc93c', ['--ic-k' as string]: '#8a2e06' }} />
        <h2 className="font-display font-bold text-[40px] md:text-[56px] leading-[1.05] text-balance">Bora começar hoje?</h2>
        <p className="max-w-[560px] text-[19px] font-bold leading-normal">
          Teste grátis por 30 dias, sem cartão. Abra no navegador e toque em “Instalar app” — sem loja.
        </p>
        <Link href="/cadastro" className={CTA_SUN}>
          Começar 30 dias grátis
        </Link>
        <Link href="/login" className="font-extrabold underline underline-offset-4">
          Já tenho conta
        </Link>
      </section>

      <footer className="flex flex-col sm:flex-row gap-3 justify-between items-center px-5 md:px-16 py-7 text-sm font-bold text-ink-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/tarefinha-horizontal-claro.svg" alt="Tarefinha" className="h-7 w-auto" />
        <span>Feito para famílias · fase de teste</span>
      </footer>
    </div>
  )
}
