import type { Metadata } from 'next'

// Áreas logadas ou de uso interno: não aparecem no Google nem em buscadores de IA.
export function privatePage(title: string): Metadata {
  return { title, robots: { index: false, follow: false } }
}
