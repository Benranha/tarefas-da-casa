import { privatePage } from '@/lib/noindex'

export const metadata = privatePage('Abrir o app')

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
