-- Migración 001: Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supabase_uid UUID UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda por supabase_uid
CREATE INDEX IF NOT EXISTS idx_users_supabase_uid ON users(supabase_uid);

-- Índice para búsqueda por email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

COMMENT ON TABLE users IS 'Tabla de usuarios de Mizu Notes';
COMMENT ON COLUMN users.supabase_uid IS 'ID único de Supabase Auth';
