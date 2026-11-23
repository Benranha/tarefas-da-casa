import { NextResponse } from 'next/server'
import { getFamily } from '@/lib/auth/server'
import { unauthorized } from '@/lib/http'
import { listarSugestoes } from '@/lib/mcp/propostas'

export const dynamic = 'force-dynamic'

// Sugestões que o Claude (conector) deixou esperando o responsável na Fila.
export async function GET() {
  const family = await getFamily()
  if (!family) return unauthorized()
  return NextResponse.json({ sugestoes: await listarSugestoes(family.ownerId) })
}
