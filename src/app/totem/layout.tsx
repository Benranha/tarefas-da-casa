import { privatePage } from '@/lib/noindex'

export const metadata = privatePage('Totem da família')

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
