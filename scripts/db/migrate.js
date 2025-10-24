import { config } from 'dotenv';
config();
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
            console.log(`📋 Ejecutando: ${migrationFile}`);

            const migrationPath = join(__dirname, '../src/backend/database/migrations', migrationFile);
            const sql = readFileSync(migrationPath, 'utf8');
            
            // Dividir por punto y coma y ejecutar cada consulta
            const queries = sql.split(';').filter(q => q.trim().length > 0);
            
            for (const query of queries) {
                if (query.trim() && !query.trim().startsWith('--')) {
                    await client.query(query);
                }
            }
            
            console.log(`✅ ${migrationFile} - COMPLETADO`);
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
if (import.meta.url === `file://${process.argv[1]}`) {
    runMigrations().catch(error => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
}

export { runMigrations };