-- 002: família com vários responsáveis, horários, criança com aparelho próprio (PIN) e push.
-- Idempotente. Aplicar no SQL Editor do Neon antes do deploy desta versão.

-- Mais de um responsável por família. A "família" continua identificada pelo owner_id de
-- quem a criou; quem aceita um convite entra aqui apontando para esse owner_id.
CREATE TABLE IF NOT EXISTS family_members (
    user_id UUID PRIMARY KEY REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
    family_owner_id UUID NOT NULL REFERENCES families(owner_id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS family_members_family_idx ON family_members (family_owner_id);

CREATE TABLE IF NOT EXISTS family_invites (
    code TEXT PRIMARY KEY DEFAULT replace(gen_random_uuid()::text, '-', ''),
    family_owner_id UUID NOT NULL REFERENCES families(owner_id) ON DELETE CASCADE,
    created_by UUID REFERENCES neon_auth."user"(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '7 days',
    used_at TIMESTAMPTZ
);

-- Horários de acordar/dormir de cada criança e acesso pelo aparelho dela.
ALTER TABLE children
    ADD COLUMN IF NOT EXISTS wake_time TIME NOT NULL DEFAULT '07:00',
    ADD COLUMN IF NOT EXISTS bed_time TIME NOT NULL DEFAULT '21:00',
    ADD COLUMN IF NOT EXISTS has_device BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS invite_code TEXT NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
    ADD COLUMN IF NOT EXISTS pin_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS pin_locked_until TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS children_invite_code_idx ON children (invite_code);

-- Lembrete de horário já enviado hoje para esta ocorrência.
ALTER TABLE task_instances ADD COLUMN IF NOT EXISTS reminded_at TIMESTAMPTZ;

-- Inscrições de notificação push (PWA): de um responsável (user_id) ou de uma criança (child_id).
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_id UUID REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK ((user_id IS NULL) <> (child_id IS NULL))
);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON push_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS push_subscriptions_child_idx ON push_subscriptions (child_id);
