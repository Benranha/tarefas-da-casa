import { NextResponse } from 'next/server'
import { limpeza } from '@/lib/mcp/store'

export const dynamic = 'force-dynamic'

// Limpeza diária do conector do Claude: sugestões com mais de 30 dias, códigos e tokens vencidos, conexões
// revogadas há mais de 30 dias e apps registrados que ninguém usou. É o que sustenta o prazo dito em /privacidade.
// A Vercel Cron chama uma vez por dia (vercel.json), com o CRON_SECRET no cabeçalho. A resposta traz só contagens.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  try {
    return NextResponse.json(await limpeza())
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('cron/limpeza:', msg.slice(0, 300))
    if (/mcp_/.test(msg)) return NextResponse.json({ error: 'Aplique db/migrations/009_conector_claude.sql no Neon antes.' }, { status: 503 })
    return NextResponse.json({ error: 'Não foi possível fazer a limpeza.' }, { status: 500 })
  }
}
