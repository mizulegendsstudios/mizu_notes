-- Migración 003: Crear tabla de sesiones de sincronización
CREATE TABLE IF NOT EXISTS sync_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    last_sync_at TIMESTAMPTZ DEFAULT NOW(),
    sync_token VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para sesiones de sync
CREATE INDEX IF NOT EXISTS idx_sync_sessions_user_device ON sync_sessions(user_id, device_id);
CREATE INDEX IF NOT EXISTS idx_sync_sessions_last_sync ON sync_sessions(last_sync_at DESC);

COMMENT ON TABLE sync_sessions IS 'Sesiones de sincronización por dispositivo';
COMMENT ON COLUMN sync_sessions.device_id IS 'ID único del dispositivo/cliente';
COMMENT ON COLUMN sync_sessions.sync_token IS 'Token para sincronización incremental';
