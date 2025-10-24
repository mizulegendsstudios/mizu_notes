import { config } from 'dotenv';
config();
import { db } from './src/backend/database/connection.js';

async function testMigrations() {
    try {
        // Ejecutar migración de users directamente
        const usersSQL = `
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                supabase_uid UUID UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                username VARCHAR(100),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `;
        await db.query(usersSQL);
        console.log('✅ Tabla users creada');

        // Verificar tablas nuevamente
        const tables = await db.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
        console.log('Tablas ahora:', tables.rows.map(r => r.table_name));
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await db.close();
    }
}

testMigrations();