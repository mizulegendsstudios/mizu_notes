// scripts/db/migrate.js
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { db } from '../../src/backend/database/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
    const client = await db.pool.connect();
    
    try {
        console.log('🚀 Iniciando ejecución de migraciones...');
        await client.query('BEGIN');

        const migrations = [
            '001_create_users.sql',
            '002_create_notes.sql'
        ];

        for (const migrationFile of migrations) {
            console.log(\📋 Ejecutando: \\);
            
            const migrationPath = join(__dirname, '../../src/backend/database/migrations', migrationFile);
            const sql = readFileSync(migrationPath, 'utf8');
            
            await client.query(sql);
            console.log(\✅ \ - COMPLETADO\);
        }

        await client.query('COMMIT');
        console.log('🎉 ¡Todas las migraciones ejecutadas correctamente!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error en migraciones:', error.message);
        throw error;
    } finally {
        client.release();
        await db.close();
    }
}

// Ejecutar si es llamado directamente
if (import.meta.url === \ile://\\) {
    runMigrations().catch(error => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
}

export { runMigrations };
