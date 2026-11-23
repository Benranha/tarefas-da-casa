import { metadadosDoRecurso } from '@/lib/mcp/metadados'
import { preflight } from '@/lib/mcp/oauth'

export const dynamic = 'force-dynamic'

// Alguns clientes procuram os metadados com o caminho do recurso no fim (RFC 9728, seção 3.1).
export const GET = metadadosDoRecurso
export const OPTIONS = preflight
