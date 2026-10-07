-- 005: assinaturas (cobrança) para o painel admin. Idempotente.
-- Famílias sem linha aqui são tratadas como 'trialing' (trial_ends_at no futuro) ou 'expired'.
-- Os webhooks do gateway de pagamento devem gravar/atualizar esta tabela.
CREATE TABLE IF NOT EXISTS subscriptions (
    family_id UUID PRIMARY KEY REFERENCES families(owner_id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('trialing','active','past_due','canceled','expired')),
    plan_price_cents INTEGER NOT NULL DEFAULT 1990 CHECK (plan_price_cents >= 0),
    current_period_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    last_payment_failed_at TIMESTAMPTZ,
    provider_customer_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions (status);
CREATE INDEX IF NOT EXISTS task_instances_approved_at_idx ON task_instances (approved_at) WHERE status = 'approved';
