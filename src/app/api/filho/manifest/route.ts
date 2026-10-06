import { NextResponse, type NextRequest } from 'next/server'
import { CHILD_INVITE, notFound } from '@/lib/http'

// Manifesto do app instalado a partir do link da criança: abre direto no /filho dela
// (o manifesto padrão abre o seletor de modo).
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('c') ?? ''
  if (!CHILD_INVITE.test(code)) return notFound()
  const start = `/filho?c=${code}`
  return NextResponse.json(
    {
      name: 'Tarefinha',
      short_name: 'Tarefinha',
      description: 'Minhas tarefas',
      id: start,
      start_url: start,
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#FFF8EF',
      theme_color: '#C0430E',
      icons: [
        { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
        { src: '/icons/icon-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    { headers: { 'Content-Type': 'application/manifest+json' } },
  )
}
