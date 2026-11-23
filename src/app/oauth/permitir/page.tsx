import { auth } from '@/lib/auth/server'
import AuthShell from '@/components/AuthShell'
import { privatePage } from '@/lib/noindex'
import { CAMPOS_PEDIDO, MCP_PATH, enderecoPublico, validarPedido } from '@/lib/mcp/oauth'
import { buscarCliente } from '@/lib/mcp/store'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = privatePage('Conectar ao Tarefinha')

function Invalido() {
  return (
    <AuthShell title="Esse link não vale mais" subtitle="O pedido de conexão está incompleto ou venceu. Volte ao Claude e tente conectar de novo." icon="brilho">
      <p className="text-center text-sm text-ink-muted">Se continuar assim, escreva para contato@tarefinha.app.br.</p>
    </AuthShell>
  )
}

// Tela "Deixar o Claude usar o Tarefinha?". Aqui o responsável decide: nada é liberado sem o toque em Permitir.
export default async function Permitir({ searchParams }: PageProps<'/oauth/permitir'>) {
  const sp = await searchParams
  const params = new URLSearchParams()
  for (const campo of CAMPOS_PEDIDO) {
    const v = sp[campo]
    if (typeof v === 'string') params.set(campo, v)
  }

  // O mesmo endereço público que o servidor usa para conferir o pedido.
  const h = await headers()
  const origem = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('x-forwarded-host') ?? h.get('host') ?? ''}`
  const resource = `${enderecoPublico(origem)}${MCP_PATH}`
  const pedido = sp.erro ? { ok: false as const } : validarPedido(params, resource)
  if (!pedido.ok) return <Invalido />

  const cliente = await buscarCliente(pedido.pedido.clientId)
  if (!cliente || !cliente.redirectUris.includes(pedido.pedido.redirectUri)) return <Invalido />

  const { data: session } = await auth.getSession()
  // Sem sessão: o começo do fluxo lembra para onde voltar e leva ao login.
  if (!session?.user) redirect(`/api/oauth/authorize?${params.toString()}`)

  const nome = String(session.user.name ?? '').trim()
  let destino = ''
  try {
    destino = new URL(pedido.pedido.redirectUri).host
  } catch {}

  return (
    <AuthShell
      title={`Deixar o ${cliente.nome} usar o Tarefinha?`}
      subtitle={nome ? `Você entrou como ${nome}.` : undefined}
      icon="estrela"
    >
      <div className="space-y-4 text-ink leading-normal">
        <p>
          <span className="font-extrabold">Ele pode ver</span> as crianças, as tarefas, a Fila, os prêmios e como foi a semana da sua família.
        </p>
        <p>
          <span className="font-extrabold">Ele pode sugerir</span>, por exemplo, criar uma tarefa ou aprovar uma da Fila. Nada acontece sozinho: você confirma cada sugestão no Tarefinha.
        </p>
        <p className="text-sm text-ink-muted">Ele não vê o código secreto das crianças, o código parental nem o link do totem.</p>
      </div>

      <form method="post" action="/api/oauth/decidir" className="mt-7 grid gap-3">
        {[...params.entries()].map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <button type="submit" name="decisao" value="permitir" className="tf-btn tf-btn--primary w-full !min-h-14">
          Permitir
        </button>
        <button type="submit" name="decisao" value="negar" className="tf-btn tf-btn--secondary w-full !min-h-14">
          Agora não
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-ink-muted">
        Depois você volta para {destino || 'o aplicativo'}. Para desconectar quando quiser, abra Família no painel.
      </p>
    </AuthShell>
  )
}
