-- Migración 002: Crear tabla de notas
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    version INTEGER NOT NULL DEFAULT 1,
    last_synced TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_user_deleted ON notes(user_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
\$\$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_notes_updated_at 
    BEFORE UPDATE ON notes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE notes IS 'Tabla de notas de Mizu Notes';
COMMENT ON COLUMN notes.user_id IS 'ID del usuario propietario';
COMMENT ON COLUMN notes.last_synced IS 'Última sincronización con el cliente';
COMMENT ON COLUMN notes.is_deleted IS 'Si la nota está marcada como eliminada (soft delete)';
