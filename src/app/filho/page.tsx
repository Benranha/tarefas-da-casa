import type { Metadata } from 'next'
import FilhoApp from './FilhoApp'

// O app instalado a partir do link da criança abre direto aqui (manifesto próprio com o código).
export async function generateMetadata({ searchParams }: PageProps<'/filho'>): Promise<Metadata> {
  const c = (await searchParams).c
  const code = typeof c === 'string' && /^[0-9a-f]{32}$/i.test(c) ? c : null
  return {
    title: 'Minhas tarefas • Tarefinha',
    manifest: code ? `/api/filho/manifest?c=${code}` : '/manifest.json',
  }
}

export default function Page() {
  return <FilhoApp />
}
