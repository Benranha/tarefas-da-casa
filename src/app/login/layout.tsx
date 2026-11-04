import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Entre no Tarefinha para aprovar as tarefas de casa dos seus filhos, acompanhar os pontos e entregar as recompensas.',
  alternates: { canonical: '/login' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
