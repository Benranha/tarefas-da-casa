-- 008: e-mails do app para o responsável (boas-vindas, "sem uso" e dicas). Idempotente.
-- Aplicar no SQL Editor do Neon antes do deploy desta versão.

-- O que já foi enviado a cada família. A chave diz qual e-mail foi:
--   'boas_vindas', 'dica:<id>' (cada dica no máximo uma vez) e 'sem_uso:AAAA-MM' (um por mês).
-- O envio reserva a chave antes (INSERT ... ON CONFLICT DO NOTHING) e só manda se conseguiu inserir.
-- Assim o aviso logo depois do onboarding e o agendador diário nunca mandam o mesmo e-mail duas vezes.
-- Não guarda endereço de e-mail nem nome: só a família e a chave.
CREATE TABLE IF NOT EXISTS email_log (
    owner_id UUID NOT NULL REFERENCES families(owner_id) ON DELETE CASCADE,
    chave TEXT NOT NULL,
    enviado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (owner_id, chave)
);

-- Quem pediu para parar de receber dicas por e-mail. Sem linha na tabela = recebe.
CREATE TABLE IF NOT EXISTS email_preferencias (
    owner_id UUID PRIMARY KEY REFERENCES families(owner_id) ON DELETE CASCADE,
    dicas BOOLEAN NOT NULL DEFAULT true,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
