import pkg from 'pg';
import { config } from 'dotenv';
config();

const { Client } = pkg;
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixAllColumns() {
    try {
        await client.connect();
        console.log('🔧 Verificando todas las columnas necesarias...');
        
        // Lista de columnas a verificar/agregar
        const columns = [
            { name: 'user_id', type: 'UUID' },
            { name: 'is_deleted', type: 'BOOLEAN DEFAULT FALSE' },
            { name: 'last_synced', type: 'TIMESTAMPTZ' },
            { name: 'version', type: 'INTEGER DEFAULT 1' }
        ];
        
        for (const column of columns) {
            const checkResult = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'notes' AND column_name = $1
            `, [column.name]);
            
            if (checkResult.rows.length === 0) {
                console.log(`➕ Agregando columna ${column.name}...`);
                await client.query(`ALTER TABLE notes ADD COLUMN ${column.name} ${column.type}`);
                console.log(`✅ Columna ${column.name} agregada`);
            } else {
                console.log(`✅ Columna ${column.name} ya existe`);
            }
        }
        
        console.log('🎉 Todas las columnas verificadas/agregadas');
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

fixAllColumns();
