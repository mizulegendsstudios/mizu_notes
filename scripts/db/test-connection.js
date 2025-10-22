import { config } from 'dotenv';
config();
import { db } from '../../src/backend/database/connection.js';

async function testConnection() {
    try {
        console.log('?? Probando conexi�n a la base de datos...');

        const result = await db.query('SELECT version()');
        console.log('? Conexi�n exitosa a PostgreSQL');
        console.log('?? Versi�n:', result.rows[0].version);

        const tables = await db.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
        `);

        console.log('?? Tablas existentes:', tables.rows.map(row => row.table_name));

        await db.close();
        console.log('?? Todas las pruebas pasaron correctamente');

    } catch (error) {
        console.error('? Error en conexi�n:', error.message);
        process.exit(1);
    }
}

testConnection();
