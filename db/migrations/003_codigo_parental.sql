-- 003: código parental do totem (protege o "Trocar modo" do tablet das crianças). Idempotente.
ALTER TABLE families
    ADD COLUMN IF NOT EXISTS parental_pin_hash TEXT,
    ADD COLUMN IF NOT EXISTS parental_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS parental_locked_until TIMESTAMPTZ;
