-- 004: teste grátis de 30 dias por família. Idempotente.
-- Famílias novas ganham 30 dias a partir da criação; as existentes, 30 dias a partir de agora.
ALTER TABLE families
    ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days');
