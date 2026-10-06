import { NextResponse } from 'next/server'
import { getFamily } from '@/lib/auth/server'
import { unauthorized } from '@/lib/http'

export const dynamic = 'force-dynamic'

export async function GET() {
  const family = await getFamily()
  if (!family) return unauthorized()
  return NextResponse.json({ totemCode: family.totemCode })
}
