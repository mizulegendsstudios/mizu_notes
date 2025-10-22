import { config } from 'dotenv';
config();
import { db } from './src/backend/database/connection.js';

async function checkTables() {
    const tables = await db.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
    console.log('Tablas en BD:', tables.rows.map(r => r.table_name));
    await db.close();
}

checkTables();