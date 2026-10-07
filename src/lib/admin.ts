import { auth } from '@/lib/auth/server'
import { sql } from '@/lib/db'

// Admin = e-mail na allowlist ADMIN_EMAILS (separados por vírgula). Nunca é um pai/mãe comum.
export async function getAdmin() {
  const { data: session } = await auth.getSession()
  const user = session?.user
  if (!user) return null
  const allow = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
  const email = String(user.email ?? '').toLowerCase()
  if (!email || !allow.includes(email)) return null
  return { userId: user.id as string, email }
}

export const PERIODS = [7, 30, 90] as const
export type Period = (typeof PERIODS)[number]
export const parsePeriod = (v: string | undefined): Period => (PERIODS.find((p) => String(p) === v) ?? 30)

export const STATUSES = ['active', 'trialing', 'past_due', 'expired', 'canceled'] as const
export type Status = (typeof STATUSES)[number]
export const STATUS_LABEL: Record<Status, string> = {
  active: 'Ativo',
  trialing: 'Em teste',
  past_due: 'Pagamento atrasado',
  expired: 'Teste expirado',
  canceled: 'Cancelado',
}
export const STATUS_TONE = { active: 'ok', trialing: 'wait', past_due: 'bad', expired: 'off', canceled: 'canceled' } as const satisfies Record<Status, string>
export const FILTER_LABEL: Record<Status, string> = {
  active: 'Ativos', trialing: 'Em teste', past_due: 'Pagamento atrasado', expired: 'Teste expirado', canceled: 'Cancelados',
}

// Uma linha por família com o status de cobrança efetivo. Sem assinatura: teste ou expirado.
export const FAMILY_STATUS_SQL = `
  SELECT f.owner_id, f.created_at, f.trial_ends_at,
         COALESCE(s.status, CASE WHEN f.trial_ends_at > now() THEN 'trialing' ELSE 'expired' END) AS status,
         COALESCE(s.plan_price_cents, 1990) AS price_cents,
         s.current_period_end, s.canceled_at, s.last_payment_failed_at, s.created_at AS sub_created_at
  FROM families f LEFT JOIN subscriptions s ON s.family_id = f.owner_id`

export const brl = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0)
export const familyName = (name: string | null | undefined, email: string) => {
  const last = (name ?? '').trim().split(/\s+/).filter(Boolean).pop()
  return last ? `Família ${last}` : email.split('@')[0]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const q = <T = Record<string, any>>(text: string, params: unknown[] = []) => sql.query(text, params) as Promise<T[]>
const n = (v: unknown) => Number(v ?? 0)

export const TZ = `'America/Manaus'`
// Dia (no fuso da casa) em que a tarefa foi aprovada.
const APPROVED_DAY = `(ti.approved_at at time zone ${TZ})::date`

// Famílias com ao menos uma tarefa aprovada nos últimos 7 dias.
const ACTIVE_7D = `SELECT DISTINCT c.owner_id FROM task_instances ti JOIN children c ON c.id = ti.child_id
  WHERE ti.status = 'approved' AND ti.approved_at >= now() - interval '7 days'`

export async function overview(period: Period) {
  const [[k], daily, funnel, [al]] = await Promise.all([
    q(`WITH fs AS (${FAMILY_STATUS_SQL}),
       ap AS (
         SELECT count(*) FILTER (WHERE ti.status = 'approved') AS approved,
                count(*) FILTER (WHERE ti.status = 'rejected') AS rejected,
                percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM (ti.approved_at - ti.completed_at)) / 60)
                  FILTER (WHERE ti.status = 'approved' AND ti.completed_at IS NOT NULL AND ti.approved_at >= ti.completed_at) AS median_min
         FROM task_instances ti
         WHERE ti.created_at >= now() - ($1 || ' days')::interval AND ti.status IN ('approved','rejected')
       )
       SELECT
         (SELECT count(*) FROM fs) AS total,
         (SELECT count(*) FROM fs WHERE status = 'active') AS paying,
         (SELECT count(*) FROM fs WHERE status = 'active' AND sub_created_at >= date_trunc('month', now())) AS paying_new,
         (SELECT coalesce(sum(price_cents), 0) FROM fs WHERE status = 'active') AS mrr_cents,
         (SELECT coalesce(sum(price_cents), 0) FROM fs WHERE status = 'active' AND sub_created_at >= date_trunc('month', now())) AS mrr_new_cents,
         (SELECT count(*) FROM fs WHERE status = 'trialing') AS trialing,
         (SELECT count(*) FROM fs WHERE status = 'trialing' AND trial_ends_at <= now() + interval '7 days') AS trial_expiring,
         (SELECT count(*) FROM fs WHERE status IN ('active','past_due','canceled') AND created_at < now() - interval '30 days') AS converted,
         (SELECT count(*) FROM fs WHERE created_at < now() - interval '30 days') AS eligible,
         (SELECT count(*) FROM fs WHERE status = 'canceled' AND canceled_at >= date_trunc('month', now())) AS churned,
         (SELECT count(*) FROM fs WHERE status = 'past_due') AS past_due,
         (SELECT count(*) FROM (${ACTIVE_7D}) a) AS active_families,
         (SELECT count(*) FROM children) AS children,
         ap.approved, ap.rejected, ap.median_min
       FROM ap`, [period]),
    q(`SELECT d::date AS day, count(ti.id)::int AS total
       FROM generate_series((now() at time zone ${TZ})::date - ($1::int - 1), (now() at time zone ${TZ})::date, interval '1 day') d
       LEFT JOIN task_instances ti ON ti.status = 'approved' AND ${APPROVED_DAY} = d::date
       GROUP BY d ORDER BY d`, [period]),
    q(`WITH cohort AS (SELECT owner_id FROM families WHERE created_at >= now() - interval '30 days'),
       ch AS (SELECT DISTINCT c.owner_id FROM children c JOIN cohort USING (owner_id)),
       tk AS (SELECT DISTINCT c.owner_id FROM tasks t JOIN children c ON c.id = t.assigned_child_id JOIN cohort USING (owner_id)),
       dn AS (SELECT DISTINCT c.owner_id FROM task_instances ti JOIN children c ON c.id = ti.child_id JOIN cohort USING (owner_id) WHERE ti.completed_at IS NOT NULL),
       ok AS (SELECT DISTINCT c.owner_id FROM task_instances ti JOIN children c ON c.id = ti.child_id JOIN cohort USING (owner_id) WHERE ti.status = 'approved'),
       sb AS (SELECT s.family_id AS owner_id FROM subscriptions s JOIN cohort ON cohort.owner_id = s.family_id WHERE s.status IN ('active','past_due','canceled'))
       SELECT (SELECT count(*) FROM cohort) AS created, (SELECT count(*) FROM ch) AS child, (SELECT count(*) FROM tk) AS task,
              (SELECT count(*) FROM dn) AS opened, (SELECT count(*) FROM ok) AS approved, (SELECT count(*) FROM sb) AS paid`),
    q(`SELECT
         (SELECT count(*) FROM children WHERE pin_locked_until > now()) AS locked,
         (SELECT count(*) FROM families f LEFT JOIN subscriptions s ON s.family_id = f.owner_id
            WHERE s.status = 'active' AND f.owner_id NOT IN (${ACTIVE_7D})) AS silent_paying`),
  ])
  const approved = n(k.approved)
  const days = period
  return {
    kpi: {
      total: n(k.total), paying: n(k.paying), payingNew: n(k.paying_new), mrrCents: n(k.mrr_cents), mrrNewCents: n(k.mrr_new_cents),
      trialing: n(k.trialing), trialExpiring: n(k.trial_expiring), convPct: pct(n(k.converted), n(k.eligible)),
      churned: n(k.churned), churnPct: n(k.paying) + n(k.churned) ? Math.round((n(k.churned) / (n(k.paying) + n(k.churned))) * 1000) / 10 : 0, pastDue: n(k.past_due),
      activeFamilies: n(k.active_families), activePct: pct(n(k.active_families), n(k.total)), children: n(k.children),
      approvalPct: pct(approved, approved + n(k.rejected)), rejectedPct: pct(n(k.rejected), approved + n(k.rejected)),
      medianMin: k.median_min == null ? null : Math.round(Number(k.median_min)),
      approved,
      perDay: approved / days,
      perFamily: n(k.active_families) ? approved / days / n(k.active_families) : 0,
      perChild: n(k.children) ? approved / days / n(k.children) : 0,
    },
    daily: daily.map((r) => ({ day: String(r.day).slice(0, 10), total: n(r.total) })),
    funnel: [n(funnel[0].created), n(funnel[0].child), n(funnel[0].task), n(funnel[0].opened), n(funnel[0].approved), n(funnel[0].paid)],
    alerts: { locked: n(al.locked), silentPaying: n(al.silent_paying) },
  }
}

export type SubscriberRow = {
  owner_id: string; status: Status; name: string | null; email: string; created_at: string
  children: number; per_day: number; trial_ends_at: string; current_period_end: string | null
  canceled_at: string | null; last_payment_failed_at: string | null
}

export async function subscribers(opts: { status?: Status; search?: string; trialDays?: number }) {
  const params: unknown[] = []
  const where: string[] = []
  if (opts.status) { params.push(opts.status); where.push(`fs.status = $${params.length}`) }
  if (opts.trialDays) {
    params.push(opts.trialDays)
    where.push(`fs.status = 'trialing' AND fs.trial_ends_at <= now() + ($${params.length} || ' days')::interval`)
  }
  if (opts.search) {
    params.push(`%${opts.search.replace(/[%_\\]/g, '\\$&')}%`)
    const i = params.length
    where.push(`(u.name ILIKE $${i} OR u.email ILIKE $${i} OR EXISTS (
      SELECT 1 FROM family_members fm JOIN neon_auth."user" mu ON mu.id = fm.user_id
      WHERE fm.family_owner_id = fs.owner_id AND (mu.email ILIKE $${i} OR mu.name ILIKE $${i})))`)
  }
  const [rows, counts] = await Promise.all([
    q<SubscriberRow>(`WITH fs AS (${FAMILY_STATUS_SQL})
      SELECT fs.owner_id, fs.status, u.name, u.email, fs.created_at, fs.trial_ends_at, fs.current_period_end, fs.canceled_at, fs.last_payment_failed_at,
             (SELECT count(*)::int FROM children c WHERE c.owner_id = fs.owner_id) AS children,
             (SELECT count(*)::float / 30 FROM task_instances ti JOIN children c ON c.id = ti.child_id
                WHERE c.owner_id = fs.owner_id AND ti.status = 'approved' AND ti.approved_at >= now() - interval '30 days') AS per_day
      FROM fs JOIN neon_auth."user" u ON u.id = fs.owner_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY fs.created_at DESC LIMIT 100`, params),
    q(`WITH fs AS (${FAMILY_STATUS_SQL}) SELECT status, count(*)::int AS n FROM fs GROUP BY status`),
  ])
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, n(c.n)])) as Record<string, number>
  const total = counts.reduce((a, c) => a + n(c.n), 0)
  return { rows, byStatus, total }
}

export async function familyDetail(id: string) {
  const [[f], members, kids, spark, [stats]] = await Promise.all([
    q<SubscriberRow>(`WITH fs AS (${FAMILY_STATUS_SQL})
      SELECT fs.owner_id, fs.status, u.name, u.email, fs.created_at, fs.trial_ends_at, fs.current_period_end, fs.canceled_at, fs.last_payment_failed_at
      FROM fs JOIN neon_auth."user" u ON u.id = fs.owner_id WHERE fs.owner_id = $1::uuid`, [id]),
    q(`SELECT count(*)::int AS n FROM (SELECT $1::uuid AS id UNION SELECT user_id FROM family_members WHERE family_owner_id = $1::uuid) m`, [id]),
    q(`SELECT name, color, has_device FROM children WHERE owner_id = $1::uuid ORDER BY created_at`, [id]),
    q(`SELECT d::date AS day, count(ti.id)::int AS total
       FROM generate_series((now() at time zone ${TZ})::date - 13, (now() at time zone ${TZ})::date, interval '1 day') d
       LEFT JOIN (SELECT ti.* FROM task_instances ti JOIN children c ON c.id = ti.child_id WHERE c.owner_id = $1::uuid AND ti.status = 'approved') ti
         ON ${APPROVED_DAY} = d::date
       GROUP BY d ORDER BY d`, [id]),
    q(`SELECT count(*) FILTER (WHERE ti.status = 'approved') AS approved, count(*) FILTER (WHERE ti.status = 'rejected') AS rejected,
              max(ti.completed_at) AS last_use
       FROM task_instances ti JOIN children c ON c.id = ti.child_id WHERE c.owner_id = $1::uuid`, [id]),
  ])
  if (!f) return null
  const approved = n(stats.approved)
  return {
    ...f,
    members: n(members[0]?.n),
    kids: kids as { name: string; color: string | null; has_device: boolean }[],
    spark: spark.map((r) => n(r.total)),
    approvalPct: approved + n(stats.rejected) ? pct(approved, approved + n(stats.rejected)) : null,
    lastUse: (stats.last_use as string | null) ?? null,
  }
}

export async function engagement() {
  const [[k], heat, retention, [res]] = await Promise.all([
    q(`SELECT
         (SELECT count(*) FROM task_instances WHERE status = 'approved' AND approved_at >= now() - interval '30 days') AS approved30,
         (SELECT count(*) FROM (${ACTIVE_7D}) a) AS active_families,
         (SELECT count(*) FROM children) AS children,
         (SELECT count(DISTINCT owner_id) FROM children) AS families_with_kids,
         (SELECT count(*) FROM tasks WHERE active) AS tasks,
         (SELECT count(*) FROM tasks WHERE active AND recurrence IN ('daily','weekly')) AS recurring,
         (SELECT count(*) FROM reward_redemptions WHERE created_at >= date_trunc('month', now())) AS redeemed,
         (SELECT count(*) FROM reward_redemptions WHERE created_at >= date_trunc('month', now()) AND status = 'delivered') AS delivered`),
    q(`SELECT extract(isodow FROM completed_at at time zone ${TZ})::int AS dow, extract(hour FROM completed_at at time zone ${TZ})::int AS hr, count(*)::int AS n
       FROM task_instances WHERE completed_at >= now() - interval '90 days'
       GROUP BY 1, 2`),
    q(`WITH w AS (SELECT unnest(ARRAY[1,2,3,4,6,8]) AS wk),
       first_act AS (
         SELECT f.owner_id, to_char(date_trunc('month', f.created_at at time zone ${TZ}), 'YYYY-MM') AS cohort, f.created_at
         FROM families f WHERE f.created_at >= date_trunc('month', now()) - interval '5 months'
       )
       SELECT fa.cohort, w.wk,
              count(*) FILTER (WHERE fa.created_at + (w.wk * interval '7 days') <= now())::int AS eligible,
              count(*) FILTER (WHERE fa.created_at + (w.wk * interval '7 days') <= now() AND EXISTS (
                SELECT 1 FROM task_instances ti JOIN children c ON c.id = ti.child_id
                WHERE c.owner_id = fa.owner_id AND ti.status = 'approved'
                  AND ti.approved_at >= fa.created_at + ((w.wk - 1) * interval '7 days')
                  AND ti.approved_at <  fa.created_at + (w.wk * interval '7 days')))::int AS retained,
              count(*)::int AS size
       FROM first_act fa CROSS JOIN w GROUP BY fa.cohort, w.wk ORDER BY fa.cohort, w.wk`),
    q(`SELECT (SELECT count(*) FROM families) AS total,
         (SELECT count(DISTINCT owner_id) FROM children WHERE has_device) AS device,
         (SELECT count(*) FROM families f WHERE EXISTS (SELECT 1 FROM push_subscriptions ps WHERE ps.user_id = f.owner_id OR ps.child_id IN (SELECT id FROM children WHERE owner_id = f.owner_id)
            OR ps.user_id IN (SELECT user_id FROM family_members WHERE family_owner_id = f.owner_id))) AS push,
         (SELECT count(*) FROM (SELECT family_owner_id FROM family_members GROUP BY 1) m) AS multi,
         (SELECT count(DISTINCT owner_id) FROM rewards) AS rewards`),
  ])
  const cells: Record<string, number> = {}
  for (const h of heat) cells[`${h.dow}-${h.hr}`] = n(h.n)
  const cohorts = new Map<string, { size: number; weeks: Record<number, number | null> }>()
  for (const r of retention) {
    const c = cohorts.get(r.cohort) ?? { size: n(r.size), weeks: {} }
    c.weeks[n(r.wk)] = n(r.eligible) ? pct(n(r.retained), n(r.eligible)) : null
    cohorts.set(r.cohort, c)
  }
  const total = n(res.total)
  return {
    kpi: {
      perFamily: n(k.active_families) ? n(k.approved30) / 30 / n(k.active_families) : 0,
      kidsPerFamily: n(k.families_with_kids) ? n(k.children) / n(k.families_with_kids) : 0,
      children: n(k.children),
      recurringPct: pct(n(k.recurring), n(k.tasks)),
      redeemed: n(k.redeemed),
      deliveredPct: pct(n(k.delivered), n(k.redeemed)),
    },
    heat: cells,
    cohorts: [...cohorts.entries()].map(([month, v]) => ({ month, ...v })),
    resources: {
      device: pct(n(res.device), total), push: pct(n(res.push), total),
      multi: pct(n(res.multi), total), rewards: pct(n(res.rewards), total),
    },
  }
}

export async function revenue() {
  const [r] = await q(`WITH fs AS (${FAMILY_STATUS_SQL})
    SELECT coalesce(sum(price_cents) FILTER (WHERE status = 'active'), 0) AS mrr,
           count(*) FILTER (WHERE status = 'active') AS active,
           count(*) FILTER (WHERE status = 'past_due') AS past_due,
           coalesce(sum(price_cents) FILTER (WHERE status = 'past_due'), 0) AS at_risk,
           count(*) FILTER (WHERE status = 'canceled') AS canceled FROM fs`)
  return { mrr: n(r.mrr), active: n(r.active), pastDue: n(r.past_due), atRisk: n(r.at_risk), canceled: n(r.canceled) }
}
