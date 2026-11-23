import { metadadosDoRecurso } from '@/lib/mcp/metadados'
import { preflight } from '@/lib/mcp/oauth'

export const dynamic = 'force-dynamic'

export const GET = metadadosDoRecurso
export const OPTIONS = preflight
