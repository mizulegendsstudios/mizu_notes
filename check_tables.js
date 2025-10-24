import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
    connectionString: process.env.DATABASE_URL
});

async function checkTables() {
    try {
        await client.connect();
        console.log('🔍 Verificando tablas en la base de datos...');
        
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        console.log('📊 Tablas existentes:');
        result.rows.forEach(row => console.log(' -', row.table_name));
        
        if (result.rows.length === 0) {
            console.log('❌ No hay tablas. Creando tabla notes...');
            await client.query(`
                CREATE TABLE notes (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    title TEXT NOT NULL,
                    content TEXT,
                    version INTEGER DEFAULT 1,
                    last_synced TIMESTAMPTZ,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            `);
            console.log('✅ Tabla notes creada exitosamente');
        }
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkTables();