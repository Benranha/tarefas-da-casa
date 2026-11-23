import { metadadosDoServidor } from '@/lib/mcp/metadados'
import { preflight } from '@/lib/mcp/oauth'

export const dynamic = 'force-dynamic'

export const GET = metadadosDoServidor
export const OPTIONS = preflight
