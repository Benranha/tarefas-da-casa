-- # SQL para Setup do Banco de Dados "Tarefas da Casa"
-- Fuso Horário: America/Manaus

-- 1. Tabela de Crianças
CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    avatar TEXT, -- Emoji ou URL da imagem
    color TEXT, -- Cor de destaque (hex ou classe tailwind)
    pin TEXT, -- Hash do PIN opcional
    points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Tarefas (Modelos)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT, -- Emoji ou nome de ícone Lucide
    points INTEGER DEFAULT 0,
    assigned_child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    recurrence TEXT CHECK (recurrence IN ('none', 'daily', 'weekly')),
    recurrence_days TEXT[], -- ['mon', 'tue', ...]
    due_time TIME,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Instâncias de Tarefas (Ocorrências diárias)
CREATE TABLE task_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    child_id UUID REFERENCES children(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'awaiting_approval', 'approved', 'rejected')),
    completed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES auth.users(id),
    parent_note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de Recompensas
CREATE TABLE rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    cost_points INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Crianças: Totem lê, Pais editam
CREATE POLICY "Crianças: Leitura pública" ON children FOR SELECT USING (true);
CREATE POLICY "Crianças: Pais controle total" ON children FOR ALL USING (auth.role() = 'authenticated');

-- Tarefas: Totem lê, Pais editam
CREATE POLICY "Tarefas: Leitura pública" ON tasks FOR SELECT USING (true);
CREATE POLICY "Tarefas: Pais controle total" ON tasks FOR ALL USING (auth.role() = 'authenticated');

-- Instâncias:
-- 1. Leitura pública para o Totem
CREATE POLICY "Instâncias: Leitura pública" ON task_instances FOR SELECT USING (true);
-- 2. Crianças podem marcar como 'awaiting_approval' (Update limitado)
-- Nota: Em produção, isso seria feito via RPC ou API Route para evitar expor a chave anon com permissões de update
CREATE POLICY "Instâncias: Criança marcar como feita" ON task_instances
FOR UPDATE USING (true)
WITH CHECK (status = 'awaiting_approval');
-- 3. Pais controle total
CREATE POLICY "Instâncias: Pais controle total" ON task_instances FOR ALL USING (auth.role() = 'authenticated');

-- Recompensas: Leitura pública, Pais editam
CREATE POLICY "Recompensas: Leitura pública" ON rewards FOR SELECT USING (true);
CREATE POLICY "Recompensas: Pais controle total" ON rewards FOR ALL USING (auth.role() = 'authenticated');
