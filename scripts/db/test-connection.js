// scripts/db/test-connection.js
import { db } from '../src/backend/database/connection.js';

async function testConnection() {
    try {
        console.log('🧪 Probando conexión a la base de datos...');
        
        const result = await db.query('SELECT version()');
        console.log('✅ Conexión exitosa a PostgreSQL');
        console.log('📊 Versión:', result.rows[0].version);
        
        // Probar consulta de ejemplo
        const tables = await db.query(\
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        \);
        
        console.log('📋 Tablas existentes:', tables.rows.map(row => row.table_name));
        
        await db.close();
        console.log('🎉 Todas las pruebas pasaron correctamente');
        
    } catch (error) {
        console.error('❌ Error en conexión:', error.message);
        console.log('💡 Asegúrate de:');
        console.log('   1. Tener DATABASE_URL en .env');
        console.log('   2. Haber ejecutado: npm run migrate');
        process.exit(1);
    }
}

testConnection();
