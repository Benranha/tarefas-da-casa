import { sql } from '@/lib/db'
import { SITE_URL } from '@/lib/site'
import { FAMILY_STATUS_SQL, TZ, USO_EVENTOS_SQL } from '@/lib/uso'
import { enviarEmail } from './enviar'
import { boasVindas, novidade as modeloNovidade, semUsoAprovacao, semUsoDica } from './modelos'
import { decidir, type Ambiente, type FamiliaEmail, type Plano } from './plano'
import { linksParar, temSegredo } from './token'

// Carrega as famílias, decide (plano.ts) e envia. É o que o agendador diário e o aviso logo depois do
// onboarding usam. Nada aqui devolve endereço de e-mail ou id de família: só contagens.

// Interruptor geral. Desligado, nenhum e-mail ao responsável sai (o "?dry=1" do agendador ainda mostra
// as contagens). Ligue com EMAIL_DICAS=1 depois de conferir os números, para não mandar para toda a
// base de uma vez.
export const emailsLigados = () => process.env.EMAIL_DICAS === '1'

const ambiente = (): Ambiente => ({
  agora: new Date(),
  assistente: !!process.env.GEMINI_API_KEY,
  push: !!process.env.VAPID_PRIVATE_KEY,
})

// "comUso: false" pula o cálculo do último uso (que olha todas as famílias): serve ao aviso de uma
// família só, que não precisa disso.
async function carregarFamilias({ ownerId, comUso }: { ownerId?: string; comUso: boolean }): Promise<FamiliaEmail[]> {
  const texto = `WITH fs AS (${FAMILY_STATUS_SQL})${
    comUso
      ? `,
    ${USO_EVENTOS_SQL},
    last AS (SELECT DISTINCT ON (family) family, at FROM ev WHERE at IS NOT NULL ORDER BY family, at DESC)`
      : ''
  }
  SELECT fs.owner_id, u.email, u.name, fs.status,
    floor(extract(epoch FROM (now() - fs.created_at)) / 86400)::int AS criada_ha_dias,
    ${comUso ? `((now() at time zone ${TZ})::date - (l.at at time zone ${TZ})::date)::int` : 'NULL::int'} AS away,
    EXISTS (SELECT 1 FROM tasks t JOIN children c ON c.id = t.assigned_child_id WHERE c.owner_id = fs.owner_id AND t.active) AS tem_tarefa,
    (SELECT count(*) FROM task_instances ti JOIN children c ON c.id = ti.child_id
       WHERE c.owner_id = fs.owner_id AND ti.status = 'awaiting_approval')::int AS aguardando,
    EXISTS (SELECT 1 FROM rewards r WHERE r.owner_id = fs.owner_id) AS usa_premios,
    (SELECT count(*) FROM family_members fm WHERE fm.family_owner_id = fs.owner_id)::int AS outros,
    EXISTS (SELECT 1 FROM children c WHERE c.owner_id = fs.owner_id AND c.has_device) AS com_aparelho,
    EXISTS (SELECT 1 FROM push_subscriptions ps
              WHERE ps.user_id = fs.owner_id
                 OR ps.user_id IN (SELECT fm.user_id FROM family_members fm WHERE fm.family_owner_id = fs.owner_id)) AS com_push,
    COALESCE((SELECT array_agg(e.chave) FROM email_log e WHERE e.owner_id = fs.owner_id), '{}') AS enviados,
    (SELECT max(e.enviado_em) FROM email_log e WHERE e.owner_id = fs.owner_id) AS ultimo_envio,
    COALESCE((SELECT p.dicas FROM email_preferencias p WHERE p.owner_id = fs.owner_id), true) AS aceita_dicas
  FROM fs JOIN neon_auth."user" u ON u.id = fs.owner_id${comUso ? '\n  LEFT JOIN last l ON l.family = fs.owner_id' : ''}
  WHERE u."emailVerified" = true AND fs.status IN ('trialing', 'active')${ownerId ? ' AND fs.owner_id = $1::uuid' : ''}`

  const rows = (await sql.query(texto, ownerId ? [ownerId] : [])) as Record<string, unknown>[]
  return rows.map((r) => ({
    ownerId: r.owner_id as string,
    email: r.email as string,
    nome: (r.name as string | null) ?? '',
    status: r.status as string,
    criadaHaDias: Number(r.criada_ha_dias),
    awayDias: r.away == null ? null : Number(r.away),
    temTarefa: Boolean(r.tem_tarefa),
    aguardando: Number(r.aguardando),
    usaPremios: Boolean(r.usa_premios),
    outrosResponsaveis: Number(r.outros),
    criancaComAparelho: Boolean(r.com_aparelho),
    responsavelComPush: Boolean(r.com_push),
    enviados: Array.isArray(r.enviados) ? (r.enviados as string[]) : String(r.enviados ?? '').replace(/[{}"]/g, '').split(',').filter(Boolean),
    ultimoEnvio: r.ultimo_envio ? new Date(r.ultimo_envio as string) : null,
    aceitaDicas: Boolean(r.aceita_dicas),
  }))
}

// Reserva as chaves antes de enviar: quem não consegue inserir não envia. Se só parte das chaves
// entrou, devolve o que reservou e desiste.
async function reservar(ownerId: string, chaves: string[]): Promise<boolean> {
  const valores = chaves.map((_, i) => `($1::uuid, $${i + 2})`).join(', ')
  const rows = (await sql.query(`INSERT INTO email_log (owner_id, chave) VALUES ${valores} ON CONFLICT DO NOTHING RETURNING chave`, [
    ownerId,
    ...chaves,
  ])) as { chave: string }[]
  if (rows.length === chaves.length) return true
  await liberar(ownerId, rows.map((r) => r.chave))
  return false
}

async function liberar(ownerId: string, chaves: string[]) {
  if (!chaves.length) return
  const lista = chaves.map((_, i) => `$${i + 2}`).join(', ')
  await sql.query(`DELETE FROM email_log WHERE owner_id = $1::uuid AND chave IN (${lista})`, [ownerId, ...chaves])
}

function montar(f: FamiliaEmail, plano: Plano, amb: Ambiente, parar: string) {
  const abrir = `${SITE_URL}/pais`
  if (plano.tipo === 'boas_vindas') return boasVindas({ nome: f.nome, abrir, parar, assistente: amb.assistente })
  if (plano.tipo === 'novidade') return modeloNovidade({ novidade: plano.novidade, url: SITE_URL + plano.novidade.caminho, parar })
  if (plano.variante === 'aprovacao') return semUsoAprovacao({ abrir, parar })
  return semUsoDica({ abrir, parar, novidade: plano.novidade && { ...plano.novidade, url: SITE_URL + plano.novidade.caminho } })
}

export type ResultadoEnvio = 'enviado' | 'ja-enviado' | 'falhou' | 'sem-chave' | 'sem-segredo'

async function executar(f: FamiliaEmail, plano: Plano, amb: Ambiente): Promise<ResultadoEnvio> {
  const links = linksParar(f.ownerId)
  if (!links) return 'sem-segredo' // sem o jeito de parar, não manda
  if (!process.env.RESEND_API_KEY) return 'sem-chave'
  if (!(await reservar(f.ownerId, plano.chaves))) return 'ja-enviado'

  const msg = montar(f, plano, amb, links.pagina)
  const envio = await enviarEmail({
    to: f.email,
    subject: msg.assunto,
    html: msg.html,
    text: msg.text,
    // Um toque para parar, nos leitores que oferecem (Gmail, Apple Mail).
    headers: { 'List-Unsubscribe': `<${links.api}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
  })
  if (!envio.ok) {
    await liberar(f.ownerId, plano.chaves) // o agendador tenta de novo amanhã
    return 'falhou'
  }
  return 'enviado'
}

type Contagem = { boas_vindas: number; sem_uso: number; novidade: number }
const zero = (): Contagem => ({ boas_vindas: 0, sem_uso: 0, novidade: 0 })

// Uma rodada: decide para todas as famílias e envia no máximo "limite" e-mails (no máximo 1 por
// família). Boas-vindas primeiro, depois "sem uso", depois novidades. "dry" só conta.
export async function rodarEmails({ dry, limite = 50 }: { dry: boolean; limite?: number }) {
  const amb = ambiente()
  const familias = await carregarFamilias({ comUso: true })
  const ordem: Record<Plano['tipo'], number> = { boas_vindas: 0, sem_uso: 1, novidade: 2 }
  const planos = familias
    .flatMap((f) => {
      const p = decidir(f, amb)
      return p ? [{ f, p }] : []
    })
    .sort((a, b) => ordem[a.p.tipo] - ordem[b.p.tipo])

  const candidatos = zero()
  planos.forEach(({ p }) => candidatos[p.tipo]++)
  const ativo = emailsLigados()
  const base = { ativo, segredo: temSegredo(), resend: !!process.env.RESEND_API_KEY, familias: familias.length, candidatos, limite }
  if (dry || !ativo) return { ...base, dry, enviados: zero(), jaEnviados: 0, falhas: 0 }

  const enviados = zero()
  let jaEnviados = 0
  let falhas = 0
  for (const { f, p } of planos.slice(0, limite)) {
    const r = await executar(f, p, amb)
    if (r === 'enviado') enviados[p.tipo]++
    else if (r === 'ja-enviado') jaEnviados++
    else falhas++
  }
  return { ...base, dry, enviados, jaEnviados, falhas }
}

// Logo depois de a primeira tarefa ficar pronta: não espera o agendador. Nunca lança erro, porque roda
// depois da resposta ao responsável e não pode atrapalhar o que ele estava fazendo.
export async function enviarBoasVindasAgora(ownerId: string): Promise<void> {
  if (!emailsLigados()) return
  try {
    const [f] = await carregarFamilias({ ownerId, comUso: false })
    if (!f) return
    const amb = ambiente()
    const plano = decidir(f, amb)
    if (plano?.tipo === 'boas_vindas') await executar(f, plano, amb)
  } catch (e) {
    console.error('boas-vindas:', e instanceof Error ? e.message : e)
  }
}
