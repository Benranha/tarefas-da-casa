import { remetente } from '@/lib/email/enviar';
import { emailsLigados } from '@/lib/email/rotina';
import { temSegredo } from '@/lib/email/token';
import { Chip, type Tone } from '../ui';
import TesteEmail from './Teste';

export default function AdminEmails() {
  const resend = !!process.env.RESEND_API_KEY;
  const comRemetente = !!process.env.RESEND_FROM;
  const ligados = emailsLigados();
  const segredo = temSegredo();

  const linhas: { nome: string; tone: Tone; estado: string; nota?: string }[] = [
    { nome: 'Envio pelo Resend', tone: resend ? 'ok' : 'bad', estado: resend ? 'Configurado' : 'Falta RESEND_API_KEY' },
    {
      nome: 'Remetente',
      tone: comRemetente ? 'ok' : 'wait',
      estado: comRemetente ? 'Definido' : 'Falta RESEND_FROM',
      nota: comRemetente ? remetente() : 'Sem ele, o Resend só entrega para o e-mail dono da conta.',
    },
    {
      nome: 'Avisos e dicas por e-mail',
      tone: ligados ? 'ok' : 'off',
      estado: ligados ? 'Ligados' : 'Desligados',
      nota: ligados ? undefined : 'Defina EMAIL_DICAS=1 para ligar.',
    },
    {
      nome: 'Link "Parar de receber"',
      tone: segredo ? 'ok' : 'bad',
      estado: segredo ? 'Pronto' : 'Falta EMAIL_TOKEN_SECRET',
      nota: segredo ? undefined : 'Sem ele, nenhum e-mail de dica sai.',
    },
  ];

  return (
    <div className="ad-page">
      <header className="ad-head">
        <div>
          <h1 className="ad-h1">E-mails</h1>
          <p className="ad-sub">Confira se o envio está funcionando e mande um teste para você.</p>
        </div>
      </header>

      <section className="tf-card ad-card" aria-labelledby="ad-teste-h">
        <h2 id="ad-teste-h" className="ad-h2">Teste de envio</h2>
        <p className="ad-sub ad-teste__sub">Manda um e-mail de teste para o seu endereço de admin. Serve para ver se o Resend aceita o envio e se a mensagem chega na caixa de entrada.</p>
        <TesteEmail />
      </section>

      <section className="tf-card ad-card" aria-labelledby="ad-estado-h">
        <h2 id="ad-estado-h" className="ad-h2">Como está o envio</h2>
        <ul className="ad-status">
          {linhas.map((l) => (
            <li key={l.nome}>
              <span className="ad-status__nome">
                {l.nome}
                {l.nota && <small>{l.nota}</small>}
              </span>
              <Chip tone={l.tone}>{l.estado}</Chip>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
