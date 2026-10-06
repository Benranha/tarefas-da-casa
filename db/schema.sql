-- Schema do "Tarefas da Casa" (Neon Postgres). Fuso da casa: America/Manaus.
-- Já aplicado no projeto Neon "tarefas_de_casa". O controle de acesso é feito
-- pelas rotas /api (servidor), não por RLS.

-- Uma família por usuário (pai/mãe). O totem_code é o segredo do link do tablet.
CREATE TABLE families (
    owner_id UUID PRIMARY KEY REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
    totem_code TEXT NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar TEXT,
    color TEXT,
    pin_hash TEXT,
    points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    points INTEGER NOT NULL DEFAULT 0,
    assigned_child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    recurrence TEXT CHECK (recurrence IN ('none','daily','weekly')),
    recurrence_days TEXT[], -- ['mon','tue',...]
    due_time TIME,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE task_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','awaiting_approval','approved','rejected')),
    completed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES neon_auth."user"(id) ON DELETE SET NULL,
    parent_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (task_id, child_id, date)
);
CREATE INDEX children_owner_idx ON children (owner_id);
CREATE INDEX task_instances_child_date_idx ON task_instances (child_id, date);
CREATE INDEX task_instances_status_idx ON task_instances (status);

CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    icon TEXT,
    cost_points INTEGER NOT NULL CHECK (cost_points > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pedidos de prêmio. Os pontos são reservados no pedido e devolvidos se recusado.
CREATE TABLE reward_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reward_id UUID REFERENCES rewards(id) ON DELETE SET NULL,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    icon TEXT,
    cost_points INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','delivered','denied')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);
CREATE INDEX reward_redemptions_child_idx ON reward_redemptions (child_id, status);

-- Versão 2: família com vários responsáveis, horários, aparelho da criança e push.
-- Veja db/migrations/002_familia_horarios_filho.sql (já incluído abaixo para instalações novas).
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
