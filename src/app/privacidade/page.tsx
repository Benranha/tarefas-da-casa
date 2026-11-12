import type { Metadata } from 'next'
import Link from 'next/link'

// Política de privacidade e instruções de exclusão de dados (o app da Meta pede as duas URLs).
// Cada frase aqui precisa ser verdade no código de hoje. Mudou o que o app coleta, guarda ou envia a
// terceiros? Atualize esta página no mesmo PR e troque a data de ATUALIZADA.

export const metadata: Metadata = {
  title: 'Política de privacidade',
  description:
    'Como o Tarefinha trata os dados de pais e de crianças, com quem os compartilha e como pedir a exclusão.',
  alternates: { canonical: '/privacidade' },
}

const EMAIL = 'contato@tarefinha.app.br'
const ATUALIZADA = '12 de novembro de 2026'

const mailto = (assunto: string) => `mailto:${EMAIL}?subject=${encodeURIComponent(assunto)}`

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

const SECOES = [
  ['quem-somos', 'Quem somos'],
  ['dados', 'Dados que coletamos'],
  ['usos', 'Para que usamos os dados'],
  ['criancas', 'Dados de crianças'],
  ['compartilhamos', 'Com quem compartilhamos'],
  ['assistente', 'Assistente de IA do painel'],
  ['cookies', 'Cookies e armazenamento no aparelho'],
  ['retencao', 'Por quanto tempo guardamos'],
  ['seguranca', 'Segurança'],
  ['direitos', 'Seus direitos'],
  ['exclusao-de-dados', 'Exclusão de dados'],
  ['mudancas', 'Mudanças nesta política'],
] as const

export default function Privacidade() {
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
          <h1 className="font-display font-bold text-[40px] md:text-[56px] leading-[1.05] text-balance">Política de privacidade</h1>
          <p className="mt-5 text-lg md:text-xl font-bold leading-normal text-pretty">
            Como o Tarefinha trata os dados de pais e de crianças, com quem os compartilha e como pedir que sejam apagados.
          </p>
          <p className="mt-3 text-sm font-bold opacity-90">Atualizada em {ATUALIZADA}.</p>
        </header>
      </div>

      <main className="px-5 md:px-8 py-12 md:py-16 max-w-3xl mx-auto">
        <div className="rounded-[28px] bg-surface-raised border-2 border-line p-6 md:p-8">
          <h2 className="font-display font-bold text-[26px] leading-tight mb-4">Em resumo</h2>
          <Lista>
            <li>O Tarefinha é um app para famílias organizarem as tarefas de casa. Quem cria a conta e cadastra as crianças é um adulto responsável.</li>
            <li>De cada criança guardamos só o necessário: um nome (pode ser apelido), um avatar, horários, tarefas, pontos e prêmios. Não pedimos foto nem localização.</li>
            <li>Não vendemos dados pessoais. Alguns serviços de terceiros ajudam a manter o app no ar, e todos estão listados aqui.</li>
            <li>
              Para apagar seus dados, escreva para <a className={LINK} href={mailto('Excluir meus dados')}>{EMAIL}</a>. Atendemos em até 15 dias.
            </li>
          </Lista>
        </div>

        <nav aria-label="Seções desta página" className="mt-10">
          <p className="font-extrabold mb-3">Nesta página</p>
          <ol className="grid sm:grid-cols-2 gap-x-8 gap-y-2 list-decimal pl-6 marker:font-bold marker:text-brand">
            {SECOES.map(([id, nome]) => (
              <li key={id}>
                <a className={LINK} href={`#${id}`}>
                  {nome}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <Secao id="quem-somos" titulo="Quem somos">
          <p>
            O Tarefinha (tarefinha.app.br) é o responsável pelos dados tratados no app e nas conversas pelo nosso perfil no Instagram. Para falar
            de privacidade, escreva para <a className={LINK} href={mailto('Privacidade')}>{EMAIL}</a>.
          </p>
        </Secao>

        <Secao id="dados" titulo="Dados que coletamos">
          <Sub>Do responsável, que cria a conta</Sub>
          <Lista>
            <li>Nome, e-mail e senha. Se você entra com a conta Google, o login é feito pelo Google e guardamos o nome e o e-mail da conta.</li>
            <li>A senha fica no serviço de login que usamos. O Tarefinha não guarda a sua senha.</li>
            <li>Telefone com DDD. O cadastro pede, e é preciso para abrir o painel. Usamos para falar com você sobre a conta, como suporte e o fim do teste grátis.</li>
            <li>Datas de uso: quando você entra e quando tarefas são marcadas e aprovadas. Servem para o suporte e para saber se o app está ajudando.</li>
            <li>Se você convida outro responsável, os dois veem o nome e o e-mail um do outro.</li>
          </Lista>

          <Sub>Da criança, cadastrada pelo responsável</Sub>
          <Lista>
            <li>Nome. Se preferir, use um apelido.</li>
            <li>Um avatar, que é um desenho do próprio app, e uma cor. Não usamos foto.</li>
            <li>Horários de acordar e de dormir, usados para os lembretes.</li>
            <li>Tarefas, pontos, o histórico do que foi feito e aprovado, recados dos pais, prêmios e pedidos de prêmio.</li>
            <li>Um código secreto de 4 a 8 números, que a criança escolhe. Guardamos só uma versão embaralhada dele (hash), nunca o número.</li>
            <li>O e-mail da criança, só se o responsável pedir para enviar o link por e-mail.</li>
            <li>A inscrição de notificações do aparelho, se alguém ativar. É um endereço técnico do navegador, sem nome.</li>
          </Lista>
          <p>
            No app, a criança não digita nome, e-mail nem telefone. Ela digita o código secreto e toca em &quot;feito&quot;. Não pedimos foto,
            localização, data de nascimento, escola ou endereço, e não usamos câmera nem microfone.
          </p>

          <Sub>Do Instagram, quando você fala com o nosso perfil</Sub>
          <Lista>
            <li>O texto dos comentários e das mensagens que você envia, o seu nome de usuário (@) e os dados públicos do perfil que a Meta entrega ao app.</li>
            <li>Uma ferramenta de inteligência artificial lê esse conteúdo para ajudar a responder.</li>
            <li>Podemos guardar o texto e o @ para continuar o atendimento.</li>
            <li>Também usamos o perfil para publicar posts e ver métricas.</li>
          </Lista>
        </Secao>

        <Secao id="usos" titulo="Para que usamos os dados">
          <Lista>
            <li>Fazer o app funcionar: criar a conta, mostrar as tarefas, somar os pontos e enviar lembretes e notificações.</li>
            <li>
              Enviar e-mails do app: o link da criança, boas-vindas, um aviso se a família ficar alguns dias sem usar e dicas de uso. Os e-mails
              de boas-vindas, de aviso e de dicas têm um link para parar de receber.
            </li>
            <li>Dar suporte e falar com você sobre a conta.</li>
            <li>Manter o app seguro, por exemplo bloqueando tentativas erradas de código.</li>
            <li>Entender as visitas ao site e a eficácia dos anúncios.</li>
            <li>Responder mensagens e comentários no Instagram.</li>
          </Lista>
          <p>
            Tratamos os dados para prestar o serviço que você pediu, com o consentimento do responsável no caso das crianças, e por legítimo
            interesse para a segurança e para melhorar o app (LGPD, arts. 7º e 14).
          </p>
        </Secao>

        <Secao id="criancas" titulo="Dados de crianças">
          <Lista>
            <li>O Tarefinha é para ser usado por adultos. A criança não cria conta: quem cadastra é o responsável.</li>
            <li>
              Ao cadastrar uma criança, você declara que é o responsável legal por ela e consente com o tratamento dos dados dela descrito aqui
              (LGPD, art. 14, §1º).
            </li>
            <li>
              Você pode retirar o consentimento a qualquer momento: remova a criança em Crianças, no painel, ou peça a exclusão por e-mail. Veja
              &quot;Exclusão de dados&quot;.
            </li>
            <li>Não mostramos anúncios às crianças e não usamos os dados delas para publicidade.</li>
          </Lista>
        </Secao>

        <Secao id="compartilhamos" titulo="Com quem compartilhamos">
          <p>Estes serviços recebem dados para o app funcionar:</p>
          <Lista>
            <li><strong>Neon</strong>: banco de dados e login. O banco fica em São Paulo.</li>
            <li><strong>Vercel</strong>: hospedagem do site e do app. Os servidores que respondem ao app ficam nos Estados Unidos.</li>
            <li>
              <strong>Resend</strong>: envio de e-mails. Recebe o endereço de destino e o conteúdo da mensagem. No e-mail do link da criança, o
              assunto leva o nome dela.
            </li>
            <li>
              <strong>Google</strong>: o assistente de IA do painel (Gemini), o login com a conta Google e a etiqueta de medição do site (Google
              Analytics e Google Ads).
            </li>
            <li>
              <strong>Serviços de notificação dos navegadores</strong> (Google, Mozilla, Apple e outros): recebem o aviso, que viaja criptografado.
            </li>
            <li><strong>Meta</strong>: o Instagram, onde atendemos e publicamos.</li>
            <li><strong>Um serviço de inteligência artificial</strong>: lê as mensagens do Instagram e ajuda a responder.</li>
          </Lista>
          <p>Não vendemos dados pessoais. Também podemos compartilhar dados se uma lei ou uma ordem judicial exigir.</p>
          <p>
            Parte desses serviços trata dados fora do Brasil, como a Vercel, nos Estados Unidos. Isso é uma transferência internacional de dados,
            prevista no art. 33 da LGPD.
          </p>
        </Secao>

        <Secao id="assistente" titulo="Assistente de IA do painel">
          <p>O painel dos pais tem um assistente que ajuda a criar, aprovar e devolver tarefas. Ele usa a IA Gemini, do Google.</p>
          <Lista>
            <li>
              Para responder, enviamos ao Google as últimas mensagens do chat e o que o assistente consulta no app: nomes das crianças, títulos
              de tarefas, nomes de prêmios, pontos e horários.
            </li>
            <li>Não enviamos o seu e-mail, o seu telefone, a sua senha nem os códigos dos links.</li>
            <li>O Tarefinha não guarda a conversa. Ela some quando você recarrega ou fecha a página.</li>
            <li>O assistente só propõe. Nada muda enquanto você não toca em Confirmar.</li>
            <li>Não digite senhas nem códigos no chat.</li>
          </Lista>
          <p>O Google trata o que recebe conforme os próprios termos.</p>
        </Secao>

        <Secao id="cookies" titulo="Cookies e armazenamento no aparelho">
          <Lista>
            <li>
              <strong>Essenciais</strong>: os cookies de sessão do serviço de login, que mantêm você conectado, e o código do convite, guardado
              por 24 horas. Também lembramos neste aparelho o modo de uso, os links do totem e da criança e a sessão da criança, que dura até 180
              dias ou até ela tocar em Sair.
            </li>
            <li><strong>Preferências</strong>: tema claro ou escuro, tutorial visto, aviso de instalação fechado e dicas já mostradas.</li>
            <li>
              <strong>Medição</strong>: o site carrega a etiqueta do Google (Analytics e Ads), que mede visitas e anúncios e pode criar cookies do
              Google. Guardamos também marcas no aparelho para não contar o mesmo evento duas vezes.
            </li>
          </Lista>
          <p>
            Os eventos de medição vêm só do primeiro uso (o onboarding) e do painel dos pais, e não levam nome, e-mail, telefone nem dados de
            crianças. Você pode
            apagar cookies e dados do site nas configurações do navegador. Depois disso será preciso entrar de novo.
          </p>
        </Secao>

        <Secao id="retencao" titulo="Por quanto tempo guardamos">
          <Lista>
            <li>Guardamos os dados enquanto a conta existir.</li>
            <li>
              Quando você remove uma criança no painel, apagamos as tarefas, o histórico, os pontos, os pedidos de prêmio e as notificações dela.
              O e-mail da criança, se foi informado, também some.
            </li>
            <li>Para apagar a conta inteira, ou o que guardamos do Instagram, peça pelo e-mail de contato. Veja &quot;Exclusão de dados&quot;.</li>
            <li>O conteúdo e o @ do Instagram ficam guardados até a pessoa pedir a exclusão.</li>
            <li>Ainda não apagamos contas paradas nem dados antigos sozinhos.</li>
            <li>As cópias de segurança do banco de dados podem guardar dados já apagados por um curto período.</li>
          </Lista>
        </Secao>

        <Secao id="seguranca" titulo="Segurança">
          <Lista>
            <li>O código secreto da criança e o código parental do totem são guardados embaralhados (hash). Depois de 5 tentativas erradas, o acesso fica bloqueado por 5 minutos.</li>
            <li>Cada família só acessa os próprios dados.</li>
            <li>
              Os links do totem e da criança têm códigos longos e secretos. Quem tem o link do totem vê, sem digitar código, os nomes, avatares,
              pontos e horários das crianças da família e os prêmios. Por isso, compartilhe esse link só com quem mora na casa.
            </li>
            <li>O site funciona com HTTPS.</li>
            <li>
              O painel interno do Tarefinha é restrito a poucas pessoas autorizadas. Ele mostra nome, e-mail e telefone dos responsáveis, nomes das
              crianças e datas de uso, para dar suporte.
            </li>
          </Lista>
          <p>Nenhum sistema é totalmente seguro. Se houver um incidente que traga risco a você, avisaremos você e a ANPD, como a LGPD pede.</p>
        </Secao>

        <Secao id="direitos" titulo="Seus direitos">
          <p>A LGPD (art. 18) dá a você o direito de pedir:</p>
          <Lista>
            <li>a confirmação de que tratamos seus dados e o acesso a eles;</li>
            <li>a correção de dados incompletos ou errados;</li>
            <li>a anonimização, o bloqueio ou a eliminação de dados desnecessários;</li>
            <li>a portabilidade dos dados;</li>
            <li>a eliminação dos dados tratados com o seu consentimento;</li>
            <li>a informação sobre com quem compartilhamos os dados;</li>
            <li>a revogação do consentimento.</li>
          </Lista>
          <p>
            Para pedir, escreva para <a className={LINK} href={mailto('Meus dados')}>{EMAIL}</a> pelo e-mail da conta, para sabermos que é você.
            Respondemos em até 15 dias.
          </p>
          <p>
            Hoje o app não tem botão para excluir a conta nem para baixar seus dados. Atendemos esses pedidos por e-mail, de forma manual. No
            painel, você mesmo pode editar e remover tarefas, remover prêmios e crianças, redefinir o código de uma criança e desligar as
            notificações.
          </p>
          <p>
            Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD), em{' '}
            <a className={LINK} href="https://www.gov.br/anpd" rel="noopener noreferrer">
              www.gov.br/anpd
            </a>
            .
          </p>
        </Secao>

        <Secao id="exclusao-de-dados" titulo="Exclusão de dados">
          <p>
            Esta seção explica como apagar os seus dados no Tarefinha e nas conversas pelo Instagram. Nós atendemos em até 15 dias e avisamos
            por e-mail quando terminar.
          </p>

          <div className="rounded-[28px] bg-sun-soft border-2 border-line p-6 flex flex-col gap-4">
            <Sub>Conta do Tarefinha: responsável e crianças</Sub>
            <Passos>
              <li>
                Escreva para <a className={LINK} href={mailto('Excluir meus dados')}>{EMAIL}</a> pelo e-mail da conta, com o assunto &quot;Excluir
                meus dados&quot;.
              </li>
              <li>Conferimos que o pedido vem do e-mail da conta. Se você não tem mais acesso a ele, conte como podemos confirmar que a conta é sua.</li>
              <li>Apagamos a conta de login, as crianças, as tarefas, o histórico, os prêmios e as notificações.</li>
              <li>Avisamos por e-mail quando terminar.</li>
            </Passos>
          </div>

          <div className="rounded-[28px] bg-surface-raised border-2 border-line p-6 flex flex-col gap-4">
            <Sub>Só uma criança</Sub>
            <p>
              No painel, em Crianças, toque na lixeira ao lado da criança. Apagamos na hora as tarefas, o histórico, os pontos e as notificações
              dela, e o e-mail dela, se foi informado.
            </p>
          </div>

          <div className="rounded-[28px] bg-surface-raised border-2 border-line p-6 flex flex-col gap-4">
            <Sub>Instagram</Sub>
            <p>Se você escreveu para o nosso perfil no Instagram e quer apagar o que guardamos:</p>
            <Passos>
              <li>
                Escreva para <a className={LINK} href={mailto('Excluir meus dados do Instagram')}>{EMAIL}</a> com o assunto &quot;Excluir meus dados
                do Instagram&quot; e o seu @ (nome de usuário).
              </li>
              <li>Apagamos o texto das suas mensagens e comentários e o seu @ do que guardamos.</li>
              <li>Avisamos por e-mail ou por mensagem quando terminar.</li>
            </Passos>
            <p>
              O que está na sua conta do Instagram e nos servidores da Meta segue as regras da Meta. Você pode apagar as suas mensagens e
              comentários direto no Instagram.
            </p>
          </div>

          <div className="rounded-[28px] bg-surface-raised border-2 border-line p-6 flex flex-col gap-4">
            <Sub>Parar de receber dicas por e-mail</Sub>
            <p>Toque no link &quot;toque aqui&quot; no fim do e-mail, ou use o interruptor &quot;Receber dicas por e-mail&quot; na tela Família do painel.</p>
          </div>

          <p>Podemos guardar o que a lei obrigar. As cópias de segurança do banco de dados podem guardar dados já apagados por um curto período.</p>
        </Secao>

        <Secao id="mudancas" titulo="Mudanças nesta política">
          <p>
            Podemos atualizar esta política. A data no topo mostra a última versão. Se a mudança for importante, avisamos no app ou por e-mail.
          </p>
          <p>
            Dúvidas? Escreva para <a className={LINK} href={mailto('Privacidade')}>{EMAIL}</a>.
          </p>
        </Secao>
      </main>

      <footer className="flex flex-col sm:flex-row gap-3 justify-between items-center px-5 md:px-16 py-7 text-sm font-bold text-ink-muted border-t-2 border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/tarefinha-horizontal-claro.svg" alt="Tarefinha" className="h-7 w-auto" />
        <nav aria-label="Rodapé" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          <Link href="/">Página inicial</Link>
          <Link href="/conheca">Conheça o app</Link>
          <Link href="/cadastro">Criar conta</Link>
          <Link href="/login">Entrar</Link>
        </nav>
        <span>Feito para famílias brasileiras</span>
      </footer>
    </div>
  )
}
