-- ═══════════════════════════════════════════════════════════════
-- AUTH MIGRATION — 4Chartz
-- Rode no Supabase > SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  salt          TEXT NOT NULL,
  role          TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- 2. Sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  token      TEXT PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- 3. Preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme           TEXT DEFAULT 'original',
  export_mov      BOOLEAN DEFAULT false,
  export_alpha    BOOLEAN DEFAULT false,
  show_callouts   BOOLEAN DEFAULT true,
  show_auditor    BOOLEAN DEFAULT true,
  zoom_enabled    BOOLEAN DEFAULT false,
  engine          TEXT DEFAULT 'remotion',
  background_type TEXT DEFAULT 'dark',
  upload_mode     TEXT DEFAULT 'vision',
  custom_palette  JSONB,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add user_id to jobs (se já existir a tabela)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
CREATE INDEX IF NOT EXISTS jobs_user_id_idx ON jobs(user_id);

-- 5. Cria o admin com senha placeholder (vai definir via /auth/bootstrap)
INSERT INTO users (email, name, password_hash, salt, role)
VALUES (
  'gianluca.palmisciano@timeprimo.com',
  'Gianluca',
  'CHANGE_VIA_APP',
  'CHANGE_VIA_APP',
  'admin'
) ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- ═══════════════════════════════════════════════════════════════
-- DEPOIS DE RODAR ESTE SQL:
-- Abra o terminal e execute:
--   curl -X POST http://localhost:8080/auth/bootstrap \
--        -H "Content-Type: application/json" \
--        -d "{\"password\": \"SUA_SENHA_AQUI\"}"
-- Ou via browser: veja instruções no SETUP.md
-- ═══════════════════════════════════════════════════════════════
