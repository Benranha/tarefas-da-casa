import { NextResponse } from 'next/server'
import { vapidPublicKey } from '@/lib/push'

export const dynamic = 'force-dynamic'

// Chave pública VAPID (vazia se as notificações não estão configuradas no servidor).
export async function GET() {
  return NextResponse.json({ key: vapidPublicKey() })
}
