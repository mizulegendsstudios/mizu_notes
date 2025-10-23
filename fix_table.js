import pkg from 'pg';
import { config } from 'dotenv';
config();

const { Client } = pkg;
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixTable() {
    try {
        await client.connect();
        console.log('🔧 Arreglando tabla notes...');
        
        // Verificar si la columna user_id existe
        const checkResult = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'notes' AND column_name = 'user_id'
        `);
        
        if (checkResult.rows.length === 0) {
            console.log('➕ Agregando columna user_id...');
            await client.query(`ALTER TABLE notes ADD COLUMN user_id UUID`);
            console.log('✅ Columna user_id agregada');
        } else {
            console.log('✅ Columna user_id ya existe');
        }
        
        // Para testing, podemos agregar un usuario por defecto
        console.log('👤 Verificando usuarios...');
        const usersResult = await client.query('SELECT id FROM users LIMIT 1');
        
        if (usersResult.rows.length > 0) {
            const defaultUserId = usersResult.rows[0].id;
            console.log('✅ Usuario encontrado:', defaultUserId);
        } else {
            console.log('ℹ️ No hay usuarios, pero la tabla está lista');
        }
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

fixTable();