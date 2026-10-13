"use client";
import React, { useEffect, useState } from 'react';
import { Inbox, User, ListChecks, Gift, Users, Tablet, Sparkles } from 'lucide-react';

const SEEN_KEY = 'tarefinha-tutorial-visto';

const STEPS = [
  {
    icon: Sparkles,
    title: 'Bem-vindo ao Tarefinha!',
    text: 'Aqui você organiza as tarefas da casa e as crianças ganham pontos por fazê-las. Em poucos passos você vê como tudo funciona.',
  },
  {
    icon: User,
    title: '1. Cadastre as crianças',
    text: 'Em Crianças, adicione cada filho com nome, avatar e os horários de acordar e dormir. Cada um escolhe um código secreto para mexer nas próprias tarefas.',
  },
  {
    icon: ListChecks,
    title: '2. Crie as tarefas',
    text: 'Em Tarefas, defina o que cada criança deve fazer, quantos pontos vale e, se quiser, um horário. As tarefas aparecem para elas todo dia.',
  },
  {
    icon: Tablet,
    title: '3. Abra o totem no tablet',
    text: 'Na Fila, copie o link do totem e abra num tablet na sala. Ali as crianças veem as tarefas do dia e avisam quando terminam. Quem tem celular pode usar o link próprio.',
  },
  {
    icon: Inbox,
    title: '4. Aprove na Fila',
    text: 'Quando a criança avisa que fez, a tarefa chega na Fila. Aprove para somar os pontos ou devolva com um recado para ela tentar de novo.',
  },
  {
    icon: Gift,
    title: '5. Troque pontos por recompensas',
    text: 'Em Recompensas, cadastre prêmios e quanto custam. A criança pede com os pontos e você marca como entregue (ou recusa) quando chegar o pedido.',
  },
  {
    icon: Users,
    title: 'Família e notificações',
    text: 'Em Família, convide outro responsável e ative as notificações. Você pode rever este tutorial quando quiser pelo botão Tutorial do menu.',
  },
];

// Abre o tutorial pela primeira vez que o responsável entra; depois só pelo botão do menu.
export default function Tutorial({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && finish();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    try { localStorage.setItem(SEEN_KEY, '1'); } catch {}
    onClose();
  }

  const s = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <div className="tf-tour" role="dialog" aria-modal="true" aria-label="Tutorial">
      <div className="tf-tour__card">
        <span className="tf-tour__icon"><s.icon size={32} /></span>
        <h2>{s.title}</h2>
        <p>{s.text}</p>
        <div className="tf-tour__dots" aria-label={`Passo ${step + 1} de ${STEPS.length}`}>
          {STEPS.map((_, i) => <span key={i} data-on={i === step || undefined} />)}
        </div>
        <div className="tf-tour__actions">
          {last ? (
            <button type="button" onClick={() => setStep(step - 1)} className="tf-tour__skip">Voltar</button>
          ) : (
            <button type="button" onClick={finish} className="tf-tour__skip">Pular</button>
          )}
          <div className="flex gap-2">
            {step > 0 && !last && (
              <button type="button" onClick={() => setStep(step - 1)} className="tf-btn tf-btn--secondary">Voltar</button>
            )}
            <button type="button" onClick={() => (last ? finish() : setStep(step + 1))} className="tf-btn tf-btn--primary">
              {last ? 'Começar' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function tutorialSeen() {
  try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return true; }
}
