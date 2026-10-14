-- 006: e-mail da criança para enviar o link dela (e lembrar para quem já foi enviado).
-- Idempotente. Aplicar no SQL Editor do Neon antes do deploy desta versão.
ALTER TABLE children
    ADD COLUMN IF NOT EXISTS invite_email TEXT,
    ADD COLUMN IF NOT EXISTS invite_sent_at TIMESTAMPTZ;
