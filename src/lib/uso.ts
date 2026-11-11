// Peças de SQL usadas pelo painel admin e pelos e-mails do app. Ficam aqui para os dois falarem da
// mesma coisa quando dizem "status da família" e "último uso", sem um depender do outro.

export const TZ = `'America/Manaus'`

// Uma linha por família com o status de cobrança efetivo. Sem assinatura: teste ou expirado.
export const FAMILY_STATUS_SQL = `
  SELECT f.owner_id, f.created_at, f.trial_ends_at,
         COALESCE(s.status, CASE WHEN f.trial_ends_at > now() THEN 'trialing' ELSE 'expired' END) AS status,
         COALESCE(s.plan_price_cents, 1990) AS price_cents,
         s.current_period_end, s.canceled_at, s.last_payment_failed_at, s.created_at AS sub_created_at
  FROM families f LEFT JOIN subscriptions s ON s.family_id = f.owner_id`

// Dois pedaços de WITH: "members" (os responsáveis de cada família: o titular e os convidados) e "ev"
// (cada vez que alguém usou o app: a criança marcar tarefa, um responsável aprovar ou entrar no painel).
// Quem usa escreve: WITH fs AS (...), ${USO_EVENTOS_SQL}, last AS (...)
export const USO_EVENTOS_SQL = `
    members AS (
      SELECT owner_id AS family, owner_id AS user_id FROM families
      UNION SELECT family_owner_id, user_id FROM family_members
    ),
    ev AS (
      SELECT c.owner_id AS family, ti.completed_at AS at, 'crianca' AS by
        FROM task_instances ti JOIN children c ON c.id = ti.child_id WHERE ti.completed_at IS NOT NULL
      UNION ALL
      SELECT c.owner_id, ti.approved_at, 'responsavel'
        FROM task_instances ti JOIN children c ON c.id = ti.child_id WHERE ti.approved_at IS NOT NULL
      UNION ALL
      SELECT m.family, s."createdAt", 'responsavel' FROM neon_auth.session s JOIN members m ON m.user_id = s."userId"
      UNION ALL
      SELECT m.family, s."updatedAt", 'responsavel' FROM neon_auth.session s JOIN members m ON m.user_id = s."userId"
    )
  `
