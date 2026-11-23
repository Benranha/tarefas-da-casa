import { NextResponse } from 'next/server'
import { getFamily } from '@/lib/auth/server'
import { unauthorized } from '@/lib/http'
import { listarConexoes } from '@/lib/mcp/store'

export const dynamic = 'force-dynamic'

// Apps (o Claude) que este responsável deixou usar o Tarefinha.
export async function GET() {
  const family = await getFamily()
  if (!family) return unauthorized()
  return NextResponse.json({ conexoes: await listarConexoes(family.userId) })
}
