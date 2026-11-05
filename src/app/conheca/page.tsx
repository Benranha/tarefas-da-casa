import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import TfIcon from '@/components/TfIcon'
import InstallButton from '@/components/landing/InstallButton'
import IosInstallHint from '@/components/landing/IosInstallHint'

// Página de apresentação do app para mães e pais: as telas reais (com dados de exemplo) e o que cada uma faz.
// As imagens ficam em public/conheca/.

export const metadata: Metadata = {
  title: 'Conheça o app por dentro',
  description:
    'Veja as telas do Tarefinha: a fila de aprovação dos pais, o assistente que cria tarefas por você, o quadro das crianças no tablet, o celular da criança e a troca de pontos por prêmios.',
  alternates: { canonical: '/conheca' },
}

type Shot = { src: string; w: number; h: number; alt: string }
const shot = (name: string, w: number, h: number, alt: string): Shot => ({ src: `/conheca/${name}.jpg`, w, h, alt })

const S = {
  fila: shot('fila', 1800, 2272, 'Tela de aprovação dos pais com as tarefas de hoje de Lucas, Sofia e Davi'),
  assistente: shot('assistente', 1800, 1153, 'Assistente do Tarefinha criando uma tarefa e oferecendo aprovar as tarefas que estão esperando'),
  assistenteCelular: shot('assistente-celular', 1170, 1992, 'Assistente do Tarefinha no celular'),
  criancas: shot('criancas', 1800, 2077, 'Cadastro das crianças com avatar, cor e horários'),
  tarefas: shot('tarefas', 1800, 2391, 'Tela de tarefas com ícones, pontos, horários e dias da semana'),
  historico: shot('historico', 1800, 1617, 'Histórico com os pontos de cada criança e as tarefas feitas'),
  recompensas: shot('recompensas', 1800, 2111, 'Recompensas cadastradas e pedidos das crianças'),
  filaCelular: shot('fila-celular', 1170, 1992, 'Aprovação de tarefas pelo celular'),
  menuCelular: shot('menu-celular', 1170, 1992, 'Menu do Tarefinha no celular'),
  totemEscolha: shot('totem-escolha', 1800, 1257, 'Tablet da casa: cada criança toca no próprio rosto'),
  totemCodigo: shot('totem-codigo', 1800, 1257, 'Tablet da casa: a criança digita o código secreto dela'),
  totemTarefas: shot('totem-tarefas', 1800, 1257, 'Tablet da casa: tarefas do dia da Sofia'),
  totemPremios: shot('totem-premios', 1800, 1257, 'Tablet da casa: prêmios que dá para trocar pelos pontos'),
  criancaTarefas: shot('crianca-tarefas', 1170, 1992, 'Celular da criança com as tarefas do dia'),
  criancaPremios: shot('crianca-premios', 1170, 1992, 'Celular da criança com os prêmios'),
}

const CTA_BASE =
  'inline-flex items-center justify-center text-center min-h-16 px-9 rounded-full font-display font-semibold text-xl md:text-2xl'
const CTA_SUN = `${CTA_BASE} bg-sun text-on-sun shadow-[0_6px_0_rgba(58,42,34,.3)] active:translate-y-0.5 active:shadow-none`
const CTA_OUTLINE = `${CTA_BASE} border-[3px] border-[#fff8ef] text-[#fff8ef]`

// Moldura de navegador (computador), de celular ou de tablet em volta de um print.
function Desk({ s, crop, eager }: { s: Shot; crop?: string; eager?: boolean }) {
  return (
    <div className="overflow-hidden rounded-[18px] border-2 border-line bg-white shadow-[0_6px_0_rgba(58,42,34,.08),0_18px_40px_rgba(58,42,34,.16)]">
      <div className="flex items-center gap-1.5 h-8 px-3 bg-surface-sunken border-b-2 border-line" aria-hidden="true">
        <i className="size-2.5 rounded-full bg-[#f08b6b]" />
        <i className="size-2.5 rounded-full bg-line-strong" />
        <i className="size-2.5 rounded-full bg-line-strong" />
        <span className="ml-3 rounded-full bg-white px-4 py-0.5 text-xs font-bold text-ink-muted">tarefinha.app.br</span>
      </div>
      <Image
        src={s.src}
        width={s.w}
        height={s.h}
        alt={s.alt}
        sizes="(min-width: 1024px) 640px, 100vw"
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : undefined}
        className={`block w-full h-auto ${crop ? `${crop} object-cover object-top` : ''}`}
      />
    </div>
  )
}

function Phone({ s, className = '' }: { s: Shot; className?: string }) {
  return (
    <div className={`shrink-0 rounded-[40px] bg-ink p-2.5 shadow-[0_18px_40px_rgba(58,42,34,.25)] ${className}`}>
      <Image src={s.src} width={s.w} height={s.h} alt={s.alt} sizes="280px" loading="lazy" className="block w-full h-auto rounded-[30px]" />
    </div>
  )
}

function Tablet({ s }: { s: Shot }) {
  return (
    <div className="rounded-[28px] bg-ink p-3 shadow-[0_14px_32px_rgba(58,42,34,.22)]">
      <Image src={s.src} width={s.w} height={s.h} alt={s.alt} sizes="(min-width: 768px) 480px, 100vw" loading="lazy" className="block w-full h-auto rounded-[16px]" />
    </div>
  )
}

function Points({ items, color }: { items: [string, string][]; color: string }) {
  return (
    <ul className="flex flex-col gap-4">
      {items.map(([t, d]) => (
        <li key={t} className="flex gap-3">
          <span className="mt-2 size-3 shrink-0 rounded-full" style={{ background: color }} />
          <span className="text-[17px] leading-[1.55] text-ink-muted">
            <strong className="block font-extrabold text-ink">{t}</strong>
            {d}
          </span>
        </li>
      ))}
    </ul>
  )
}

function Chip({ kid, children }: { kid: string; children: React.ReactNode }) {
  return (
    <span className="self-start rounded-full px-3.5 py-2 text-sm font-extrabold leading-none text-white" style={{ background: `var(--kid-${kid})` }}>
      {children}
    </span>
  )
}

// Bloco de texto + imagem, alternando o lado.
function Feature({
  kid,
  chip,
  title,
  text,
  points,
  media,
  flip,
}: {
  kid: string
  chip: string
  title: string
  text: string
  points: [string, string][]
  media: React.ReactNode
  flip?: boolean
}) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center px-5 md:px-16 py-14 md:py-20">
      <div className={`flex flex-col gap-5 ${flip ? 'lg:order-2' : ''}`}>
        <Chip kid={kid}>{chip}</Chip>
        <h2 className="font-display font-bold text-[34px] md:text-[44px] leading-[1.1] text-balance">{title}</h2>
        <p className="text-lg leading-[1.6] text-pretty">{text}</p>
        <Points items={points} color={`var(--kid-${kid})`} />
      </div>
      <div className={flip ? 'lg:order-1' : ''}>{media}</div>
    </section>
  )
}

const STEPS = [
  { icon: 'menina', title: 'Cadastre as crianças', body: 'Nome, carinha, cor e a hora de acordar e de dormir de cada uma.' },
  { icon: 'vassoura', title: 'Crie as tarefas', body: 'Com ícone, pontos e horário, se quiser. Elas se repetem sozinhas.' },
  { icon: 'escova', title: 'A criança faz e marca', body: 'No tablet da casa ou no celular dela, com um código só dela.' },
  { icon: 'estrela', title: 'Você aprova', body: 'Com um toque. Ou devolve com um recado para ela tentar de novo.' },
  { icon: 'presente', title: 'Pontos viram prêmios', body: 'Sorvete, cinema, passeio ou o que vocês combinarem.' },
]

const PERKS = [
  { icon: 'recado', title: 'Cada um mexe só no que é seu', body: 'Cada criança tem um código secreto, e o tablet tem uma senha dos pais. Irmão não marca tarefa do outro.' },
  { icon: 'escova', title: 'Avisos na hora certa', body: 'Você recebe um aviso quando seu filho termina uma tarefa. Ele é lembrado no horário de cada tarefa, nunca depois da hora de dormir.' },
  { icon: 'menino', title: 'Pai e mãe juntos', body: 'Convide o outro responsável. Os dois aprovam, entregam prêmios e acompanham tudo.' },
  { icon: 'presente', title: 'Sem baixar nada da loja', body: 'Abre pelo navegador e fica na tela inicial como um aplicativo. Funciona em Android, iPhone, tablet e computador.' },
  { icon: 'cama', title: 'Funciona até para quem não lê', body: 'Ícones grandes e uma cor para cada criança. Os pequenos se viram sozinhos.' },
  { icon: 'festa', title: 'Tem graça para as crianças', body: 'Pontos, confete a cada aprovação e prêmios combinados em família. Arrumar a cama vira jogo.' },
]

export default function Conheca() {
  return (
    <div className="bg-surface text-ink font-sans">
      {/* Topo */}
      <div className="bg-brand text-[#fff8ef]">
        <nav className="flex items-center justify-between gap-4 px-5 md:px-16 py-5">
          <Link href="/" aria-label="Tarefinha: página inicial">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/tarefinha-horizontal-escuro.svg" alt="Tarefinha" className="h-10 w-auto" />
          </Link>
          <Link href="/cadastro" className="inline-flex items-center min-h-12 px-6 rounded-full bg-sun text-on-sun font-extrabold whitespace-nowrap">
            Testar grátis
          </Link>
        </nav>
        <header className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center px-5 md:px-16 pt-6 md:pt-10 pb-16 md:pb-24">
          <div className="flex flex-col gap-6">
            <p className="text-base font-extrabold uppercase tracking-[0.08em] opacity-90">Conheça o app por dentro</p>
            <h1 className="font-display font-bold text-[44px] md:text-[64px] leading-[1.02] text-balance">
              Veja como a rotina da casa vira um jogo
            </h1>
            <p className="max-w-[560px] text-lg md:text-xl font-bold leading-normal text-pretty">
              Estas são as telas de verdade do Tarefinha. Você monta as tarefas, as crianças marcam o que fizeram, você aprova, e os pontos viram prêmios combinados em família.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3.5">
              <Link href="/cadastro" className={CTA_SUN}>
                Comece a testar agora: 30 dias grátis
              </Link>
              <InstallButton className={CTA_OUTLINE}>Instalar o app</InstallButton>
            </div>
            <p className="text-sm font-bold opacity-80">Sem cartão de crédito. Nomes e números das telas são de exemplo.</p>
          </div>
          <div className="relative pb-10 lg:pb-0">
            <Desk s={S.fila} crop="aspect-[1280/980]" eager />
            <Phone s={S.criancaTarefas} className="absolute -bottom-2 right-2 md:right-6 w-[34%] max-w-[200px]" />
          </div>
        </header>
      </div>

      {/* Passos */}
      <section className="px-5 md:px-16 py-16 md:py-24">
        <h2 className="font-display font-bold text-[36px] md:text-[48px] leading-[1.1] text-center mb-12">Como funciona, em 5 passos</h2>
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-col items-center text-center gap-3 rounded-[28px] bg-surface-raised border-2 border-line p-6 shadow-sticker">
              <TfIcon name={s.icon} size={64} />
              <span className="font-display font-bold text-brand-ink">Passo {i + 1}</span>
              <h3 className="font-display font-semibold text-[22px] leading-tight">{s.title}</h3>
              <p className="text-[16px] leading-[1.5] text-ink-muted text-pretty">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Para os pais */}
      <div className="border-t-2 border-line">
        <Feature
          kid="verde"
          chip="Para os pais"
          title="Ponto só vale depois do seu ok"
          text="É a tela principal. Você vê o que cada filho já fez hoje e, embaixo, o que está esperando a sua aprovação. Aprovou, os pontos caem na hora."
          points={[
            ['O dia de cada criança num olhar', 'Quantas tarefas já fez, o que falta e o que está esperando você.'],
            ['Aprovar ou devolver', 'Devolveu? Mande um recado, como “faltou guardar o Lego”, e ela tenta de novo.'],
            ['Aviso quando termina', 'Você recebe um aviso no celular quando uma tarefa é marcada como feita.'],
          ]}
          media={<Desk s={S.fila} />}
        />

        <section className="px-5 md:px-16 py-14 md:py-20 bg-[var(--kid-roxo-soft)]">
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16 items-center">
            <div className="flex flex-col gap-5">
              <Chip kid="roxo">Assistente inteligente</Chip>
              <h2 className="font-display font-bold text-[34px] md:text-[44px] leading-[1.1] text-balance">Peça com uma frase e ele faz por você</h2>
              <p className="text-lg leading-[1.6] text-pretty">
                No corre do dia, é só escrever como você falaria. O assistente, com inteligência artificial, entende o pedido e deixa tudo pronto. Nada muda sem você tocar em “Confirmar”.
              </p>
              <Points
                color="var(--kid-roxo)"
                items={[
                  ['Fala como você fala', '“Cria arrumar a mochila para a Sofia, 10 pontos, todo dia às 8 da noite” já vira uma tarefa.'],
                  ['Resolve várias de uma vez', 'Aprova todas as tarefas que estão esperando, devolve com recado ou marca o prêmio como entregue.'],
                  ['Tira dúvidas', 'Explica como usar o tablet da casa, cadastrar as crianças ou instalar o app.'],
                ]}
              />
            </div>
            <div className="flex items-end justify-center gap-5">
              <div className="hidden md:block flex-1"><Desk s={S.assistente} /></div>
              <Phone s={S.assistenteCelular} className="w-[60%] md:w-[38%] max-w-[260px]" />
            </div>
          </div>
        </section>

        <Feature
          flip
          kid="azul"
          chip="Crianças"
          title="Cada filho com o seu jeito"
          text="Cadastre cada criança com uma carinha, uma cor e os horários dela. Assim cada uma se reconhece na tela e as tarefas respeitam a rotina de cada idade."
          points={[
            ['Hora de acordar e de dormir', 'Os lembretes só aparecem dentro desse horário.'],
            ['Tem celular?', 'Ela ganha um link só dela, que você pode mandar por e-mail.'],
            ['O dia de cada um', 'Abra a página da criança para ver tudo o que ela fez hoje.'],
          ]}
          media={<Desk s={S.criancas} crop="aspect-[1280/1000]" />}
        />

        <Feature
          kid="mostarda"
          chip="Tarefas"
          title="Monte a rotina uma vez, ela se repete sozinha"
          text="Escolha um desenho, quanto a tarefa vale e para quem é. Defina se é todo dia, só em alguns dias da semana ou só hoje."
          points={[
            ['Desenhos fáceis de entender', 'Cama, louça, lição, banho, bichinho, esportes... ou qualquer emoji.'],
            ['Horário, se quiser', 'Com horário, o celular da criança avisa na hora certa.'],
            ['Copie de um filho para o outro', 'A rotina de um irmão vira a do outro num toque.'],
          ]}
          media={<Desk s={S.tarefas} crop="aspect-[1280/1050]" />}
        />

        <Feature
          flip
          kid="rosa"
          chip="Recompensas"
          title="A lojinha de prêmios da família"
          text="Vocês combinam os prêmios e quanto cada um custa em pontos. A criança pede quando juntar, e você marca como entregue."
          points={[
            ['Do pequeno ao grande', 'De uma história extra antes de dormir a um brinquedo novo.'],
            ['Pontos guardados no pedido', 'Recusou? Os pontos voltam para a criança.'],
            ['Histórico de conquistas', 'Veja quantos pontos cada filho ganhou na semana e tudo o que já fez.'],
          ]}
          media={
            <div className="grid grid-cols-1 gap-5">
              <Desk s={S.recompensas} crop="aspect-[1280/760]" />
              <Desk s={S.historico} crop="aspect-[1280/560]" />
            </div>
          }
        />

        <Feature
          kid="turquesa"
          chip="Família"
          title="Pai e mãe juntos, de qualquer lugar"
          text="Convide o outro responsável com um link. Vocês dois aprovam, entregam prêmios e acompanham tudo, pelo computador ou pelo celular."
          points={[
            ['Senha dos pais no tablet', 'As crianças não conseguem mexer nas configurações.'],
            ['Feito para o celular', 'Botões grandes embaixo da tela, fáceis de alcançar com o polegar.'],
          ]}
          media={
            <div className="flex justify-center gap-5">
              <Phone s={S.filaCelular} className="w-[46%] max-w-[260px]" />
              <Phone s={S.menuCelular} className="w-[46%] max-w-[260px] mt-10" />
            </div>
          }
        />
      </div>

      {/* Para as crianças */}
      <section className="px-5 md:px-16 py-16 md:py-24 bg-[var(--kid-azul-soft)]">
        <div className="flex flex-col items-center text-center gap-5 mb-12">
          <Chip kid="azul">Para as crianças</Chip>
          <h2 className="font-display font-bold text-[34px] md:text-[48px] leading-[1.1] text-balance">O quadro de tarefas da casa, no tablet da sala</h2>
          <p className="max-w-[720px] text-lg leading-[1.6] text-pretty">
            Deixe um tablet num lugar fácil de alcançar. Cada criança toca no próprio rosto, digita o código secreto dela e vê só as suas tarefas.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            [S.totemEscolha, 'Quem vai fazer as tarefas hoje?', 'Cada criança vê quantas tarefas ainda faltam.'],
            [S.totemCodigo, 'Um código só dela', 'Assim um irmão não marca a tarefa do outro.'],
            [S.totemTarefas, 'Cartões grandes e coloridos', 'Terminou? É só tocar. A tarefa vai para você aprovar.'],
            [S.totemPremios, 'Troca os pontos por prêmios', 'O que ainda não dá mostra quantos pontos faltam.'],
          ].map(([s, t, d]) => (
            <figure key={t as string} className="flex flex-col gap-4">
              <Tablet s={s as Shot} />
              <figcaption className="text-[17px] leading-[1.5] text-ink-muted">
                <strong className="block font-display font-semibold text-[22px] text-ink">{t as string}</strong>
                {d as string}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <Feature
        kid="rosa"
        chip="Celular da criança"
        title="Tem celular? A tarefa avisa na hora"
        text="Se seu filho tem celular, ele recebe um link só dele. Fica na tela inicial como um aplicativo e lembra cada tarefa no horário marcado."
        points={[
          ['Lembrete no horário', 'E nunca depois da hora de dormir.'],
          ['Recado dos pais', 'Se a tarefa voltar, ele vê o que faltou fazer.'],
          ['Comemoração', 'Confete e aviso quando você aprova.'],
          ['Pede prêmios pelo celular', 'Junta os pontos e escolhe a recompensa.'],
        ]}
        media={
          <div className="flex justify-center gap-5">
            <Phone s={S.criancaTarefas} className="w-[46%] max-w-[280px]" />
            <Phone s={S.criancaPremios} className="w-[46%] max-w-[280px] mt-10" />
          </div>
        }
      />

      {/* Vantagens */}
      <section className="px-5 md:px-16 py-16 md:py-24 bg-surface-raised border-y-2 border-line">
        <h2 className="font-display font-bold text-[36px] md:text-[48px] leading-[1.1] text-center mb-12">Pensado para a sua família</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PERKS.map((p) => (
            <div key={p.title} className="flex flex-col gap-3 rounded-[28px] bg-surface border-2 border-line p-7">
              <TfIcon name={p.icon} size={52} />
              <h3 className="font-display font-semibold text-[24px] leading-tight">{p.title}</h3>
              <p className="text-[17px] leading-[1.55] text-ink-muted text-pretty">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Chamada final */}
      <section id="instalar" className="flex flex-col items-center text-center gap-6 px-5 md:px-16 py-20 md:py-28 bg-brand text-[#fff8ef]">
        <TfIcon name="festa" size={96} style={{ ['--ic-b' as string]: '#ffc93c', ['--ic-k' as string]: '#8a2e06' }} />
        <h2 className="font-display font-bold text-[40px] md:text-[56px] leading-[1.05] text-balance">Pronto para organizar a rotina da sua casa?</h2>
        <p className="max-w-[580px] text-lg md:text-[19px] font-bold leading-normal text-pretty">
          Crie a conta, cadastre as crianças e veja as primeiras tarefas aprovadas ainda hoje. Sem cartão de crédito e sem baixar nada da loja.
        </p>
        <IosInstallHint />
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3.5">
          <Link href="/cadastro" className={CTA_SUN}>
            Comece a testar agora: 30 dias grátis
          </Link>
          <InstallButton className={CTA_OUTLINE}>Instalar o app</InstallButton>
        </div>
        <Link href="/login" className="font-extrabold underline underline-offset-4">
          Já tenho conta
        </Link>
      </section>

      <footer className="flex flex-col sm:flex-row gap-3 justify-between items-center px-5 md:px-16 py-7 text-sm font-bold text-ink-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/tarefinha-horizontal-claro.svg" alt="Tarefinha" className="h-7 w-auto" />
        <nav aria-label="Rodapé" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          <Link href="/">Página inicial</Link>
          <Link href="/#faq">Perguntas frequentes</Link>
          <Link href="/cadastro">Criar conta</Link>
          <Link href="/login">Entrar</Link>
        </nav>
        <span>Feito para famílias brasileiras</span>
      </footer>
    </div>
  )
}
