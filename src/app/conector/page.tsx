import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/site'

// Documentação pública do conector do Claude (é o endereço de "documentação" do envio ao diretório do Claude).
// Cada frase aqui precisa ser verdade no código de hoje (src/lib/mcp). Mudou o que o Claude pode fazer? Atualize esta página,
// a tela de permissão (src/app/oauth/permitir) e /privacidade no mesmo PR. Texto segue docs/vendas/escrita.md.

export const metadata: Metadata = {
  title: 'Tarefinha no Claude',
  description:
    'Conecte o Tarefinha ao Claude para ver como foi a semana das crianças, aprovar a Fila e montar a rotina. O que o Claude faz, o que não faz e como desconectar.',
  alternates: { canonical: '/conector' },
}

const EMAIL = 'contato@tarefinha.app.br'
const MCP_URL = `${SITE_URL}/api/mcp`
const LINK = 'font-bold text-brand-ink underline underline-offset-4 break-words'

function Secao({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-6 mt-12 pt-10 border-t-2 border-line">
      <h2 id={`${id}-titulo`} className="font-display font-bold text-[28px] md:text-[34px] leading-[1.15] mb-5">
        {titulo}
      </h2>
      <div className="flex flex-col gap-4 text-[17px] leading-[1.65] text-pretty">{children}</div>
    </section>
  )
}

function Sub({ children }: { children: React.ReactNode }) {
  return <h3 className="font-display font-semibold text-[22px] leading-tight mt-2">{children}</h3>
}

function Lista({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-6 flex flex-col gap-2 marker:text-brand">{children}</ul>
}

function Passos({ children }: { children: React.ReactNode }) {
  return <ol className="list-decimal pl-6 flex flex-col gap-2 marker:font-bold marker:text-brand">{children}</ol>
}

function Codigo({ children }: { children: React.ReactNode }) {
  return <code className="block overflow-x-auto rounded-2xl bg-surface-sunken border-2 border-line px-4 py-3 text-[15px] font-mono">{children}</code>
}

export default function Conector() {
  return (
    <div className="bg-surface text-ink font-sans">
      <div className="bg-brand text-[#fff8ef]">
        <nav className="flex items-center justify-between gap-4 px-5 md:px-16 py-5">
          <Link href="/" aria-label="Tarefinha: página inicial">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/tarefinha-horizontal-escuro.svg" alt="Tarefinha" className="h-10 w-auto" />
          </Link>
          <Link href="/" className="font-extrabold underline underline-offset-4">
            Página inicial
          </Link>
        </nav>
        <header className="px-5 md:px-16 pt-6 md:pt-10 pb-14 md:pb-20 max-w-[900px]">
          <h1 className="font-display font-bold text-[40px] md:text-[56px] leading-[1.05] text-balance">Tarefinha no Claude</h1>
          <p className="mt-5 text-lg md:text-xl font-bold leading-normal text-pretty">
            Conecte o Tarefinha ao Claude e peça, na conversa, para ver como foi a semana, aprovar a Fila ou montar a rotina das crianças.
          </p>
        </header>
      </div>

      <main className="px-5 md:px-8 py-12 md:py-16 max-w-3xl mx-auto">
        <div className="rounded-[28px] bg-surface-raised border-2 border-line p-6 md:p-8">
          <h2 className="font-display font-bold text-[26px] leading-tight mb-4">Em resumo</h2>
          <Lista>
            <li>O Claude vê as crianças, as tarefas, a Fila e os prêmios da sua família, e muda isso na hora, quando você pede.</li>
            <li>Ele não mexe no cadastro das crianças, na família nem nos códigos.</li>
            <li>Você escolhe se conecta e pode desconectar quando quiser.</li>
          </Lista>
        </div>

        <Secao id="o-que-faz" titulo="O que o Claude faz">
          <Sub>Ver</Sub>
          <Lista>
            <li>As crianças: nome, pontos e horários de acordar e dormir.</li>
            <li>As tarefas, com horário, dias da semana, ícone, descrição e pontos.</li>
            <li>A Fila de aprovação e as tarefas de hoje que ainda faltam.</li>
            <li>Os prêmios e os pedidos de prêmio.</li>
            <li>Como foi a semana de cada criança.</li>
          </Lista>

          <Sub>Mudar, na hora, a seu pedido</Sub>
          <Lista>
            <li>Criar tarefas, uma ou várias de uma vez, com todas as opções.</li>
            <li>Alterar e apagar tarefas, e copiar a rotina de uma criança para outra.</li>
            <li>Aprovar, devolver (com um recado) e marcar tarefas como feitas.</li>
            <li>Entregar ou recusar pedidos de prêmio, e cadastrar, alterar e apagar prêmios.</li>
          </Lista>

          <Sub>O que ele não faz</Sub>
          <Lista>
            <li>Não cadastra nem apaga crianças, não mexe na família nem nos convites.</li>
            <li>Não vê o código secreto das crianças, o código parental nem o link do totem.</li>
            <li>Não recebe o seu e-mail, o seu telefone nem a sua senha.</li>
          </Lista>
        </Secao>

        <Secao id="como-conectar" titulo="Como conectar">
          <Passos>
            <li>
              Tenha uma conta no Tarefinha. Quem cria a conta ganha 30 dias grátis, sem cartão de crédito. <Link className={LINK} href="/cadastro">Criar conta</Link>
            </li>
            <li>No Claude (claude.ai ou o app), abra Conectores e adicione um conector personalizado.</li>
            <li>
              Cole este endereço:
              <Codigo>{MCP_URL}</Codigo>
            </li>
            <li>Entre no Tarefinha, se o Claude pedir, e toque em Permitir.</li>
            <li>Peça algo, por exemplo: &quot;Como foi a semana?&quot; ou &quot;Cria a rotina da manhã do Theo&quot;.</li>
          </Passos>
          <p>No Claude Code, use este comando:</p>
          <Codigo>claude mcp add --transport http tarefinha {MCP_URL}</Codigo>
          <p>Em contas de equipe (Team ou Enterprise), quem administra o Claude precisa adicionar o conector antes. Depois, cada pessoa toca em Conectar.</p>
        </Secao>

        <Secao id="cuidados" titulo="Antes de pedir mudanças">
          <Lista>
            <li>As mudanças valem na hora. O Tarefinha não pede uma segunda confirmação.</li>
            <li>O Claude pode pedir a sua permissão antes de cada ação, conforme a sua configuração nele.</li>
            <li>Apagar uma tarefa apaga também o histórico dela, e não dá para desfazer.</li>
            <li>
              O que o Claude lê (nomes das crianças, títulos de tarefas, pontos) vai para a Anthropic, que trata o que recebe conforme os próprios
              termos. Veja <Link className={LINK} href="/privacidade#conector">a nossa política de privacidade</Link>.
            </li>
          </Lista>
        </Secao>

        <Secao id="desconectar" titulo="Como desconectar">
          <Passos>
            <li>No painel do Tarefinha, abra Família.</li>
            <li>Em &quot;Apps conectados&quot;, toque em Desconectar.</li>
          </Passos>
          <p>O acesso termina na hora. Você também pode remover o conector dentro do Claude.</p>
        </Secao>

        <Secao id="ajuda" titulo="Dúvidas">
          <p>
            Escreva para <a className={LINK} href={`mailto:${EMAIL}?subject=${encodeURIComponent('Tarefinha no Claude')}`}>{EMAIL}</a>.
          </p>
        </Secao>
      </main>
    </div>
  )
}
