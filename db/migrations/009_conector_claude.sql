-- 009: conector do Claude (servidor MCP com login OAuth). Idempotente.
-- Aplicar no SQL Editor do Neon antes do deploy desta versão.
--
-- Nada aqui guarda dado de criança. Os tokens e códigos são guardados só como hash (SHA-256):
-- quem ler o banco não consegue usá-los. Apagar a conta do responsável apaga tudo daqui (ON DELETE CASCADE).

-- Apps que se registraram (o Claude se registra sozinho, pelo registro dinâmico de clientes).
CREATE TABLE IF NOT EXISTS mcp_clients (
    client_id TEXT PRIMARY KEY,
    client_name TEXT NOT NULL,
    redirect_uris TEXT[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mcp_clients_created_idx ON mcp_clients (created_at);

-- Uma conexão: "este responsável deixou este app usar o Tarefinha". É o que aparece em Família,
-- com o botão Desconectar. Revogar a conexão invalida todos os tokens dela. Guarda também a família
-- que o responsável tinha ao permitir: se ele mudar de família (aceitar outro convite), a conexão
-- antiga deixa de valer até ele permitir de novo.
CREATE TABLE IF NOT EXISTS mcp_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id TEXT NOT NULL REFERENCES mcp_clients(client_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
    family_owner_id UUID NOT NULL REFERENCES families(owner_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS mcp_grants_user_idx ON mcp_grants (user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS mcp_grants_client_idx ON mcp_grants (client_id);

-- Códigos de autorização: valem 5 minutos e uma única vez (PKCE obrigatório).
CREATE TABLE IF NOT EXISTS mcp_codes (
    code_hash TEXT PRIMARY KEY,
    client_id TEXT NOT NULL REFERENCES mcp_clients(client_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
    family_owner_id UUID NOT NULL REFERENCES families(owner_id) ON DELETE CASCADE,
    redirect_uri TEXT NOT NULL,
    code_challenge TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    grant_id UUID REFERENCES mcp_grants(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS mcp_codes_expires_idx ON mcp_codes (expires_at);

-- Tokens de acesso (1 hora) e de renovação (30 dias, trocado a cada uso).
CREATE TABLE IF NOT EXISTS mcp_tokens (
    token_hash TEXT PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('access', 'refresh')),
    grant_id UUID NOT NULL REFERENCES mcp_grants(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS mcp_tokens_grant_idx ON mcp_tokens (grant_id);
CREATE INDEX IF NOT EXISTS mcp_tokens_expires_idx ON mcp_tokens (expires_at);

-- Sugestões feitas pelo Claude. Ele nunca grava nada sozinho: a ação só acontece quando o responsável
-- toca em Confirmar na Fila (a mesma regra do assistente do painel). `args` é o que a ferramenta
-- devolveu do prepare, e o commit valida tudo de novo na hora de confirmar.
CREATE TABLE IF NOT EXISTS mcp_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES families(owner_id) ON DELETE CASCADE,
    grant_id UUID REFERENCES mcp_grants(id) ON DELETE SET NULL,
    tool TEXT NOT NULL,
    args JSONB NOT NULL,
    resumo TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'failed')),
    result_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
    decided_at TIMESTAMPTZ,
    decided_by UUID REFERENCES neon_auth."user"(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS mcp_proposals_owner_idx ON mcp_proposals (owner_id, status);
CREATE INDEX IF NOT EXISTS mcp_proposals_grant_idx ON mcp_proposals (grant_id);
