import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Criar conta grátis',
  description:
    'Crie sua conta no Tarefinha e monte em minutos o quadro de tarefas das crianças: tarefas do dia, pontos e recompensas. Teste grátis por 30 dias, sem cartão.',
  alternates: { canonical: '/cadastro' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
