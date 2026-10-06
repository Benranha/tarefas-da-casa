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
    points INTEGER NOT NULL DEFAULT 0,
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
    cost_points INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
