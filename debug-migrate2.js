import { config } from 'dotenv';
config();
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { db } from './src/backend/database/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function debugMigration() {
    try {
        const migrationPath = join(__dirname, 'src/backend/database/migrations/001_create_users.sql');
        console.log('Ruta:', migrationPath);
        
        const sql = readFileSync(migrationPath, 'utf8');
        console.log('SQL leído:', sql.substring(0, 100) + '...');
        
        // Probar ejecutar solo la primera línea
        await db.query('CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY DEFAULT gen_random_uuid())');
        console.log('✅ Tabla simple creada');
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await db.close();
    }
}

debugMigration();