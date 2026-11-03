-- 007: telefone do responsável, pedido no cadastro da conta. Idempotente.
-- Aplicar no SQL Editor do Neon antes do deploy desta versão.
-- Só dígitos, com DDD (10 ou 11 dígitos; o 55 do Brasil não é guardado).
CREATE TABLE IF NOT EXISTS user_phones (
    user_id UUID PRIMARY KEY REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
