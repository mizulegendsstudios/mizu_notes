import pkg from 'pg';
const { Client } = pkg;

console.log('🔧 Iniciando verificación de base de datos...');

// Verificar si DATABASE_URL está configurada
if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL no está configurada');
    console.log('💡 Asegúrate de tener un archivo .env con DATABASE_URL');
    process.exit(1);
}

console.log('📡 Conectando a la base de datos...');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkDatabase() {
    try {
        await client.connect();
        console.log('✅ Conectado a PostgreSQL');
        
        // Verificar tablas existentes
        console.log('🔍 Buscando tablas...');
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        console.log('📊 Tablas encontradas:', result.rows.length);
        result.rows.forEach(row => console.log('   -', row.table_name));
        
        // Si no existe la tabla notes, crearla
        const notesTableExists = result.rows.some(row => row.table_name === 'notes');
        
        if (!notesTableExists) {
            console.log('🚀 Creando tabla notes...');
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
        } else {
            console.log('✅ Tabla notes ya existe');
        }
        
    } catch (error) {
        console.log('❌ Error detallado:');
        console.log('   Mensaje:', error.message);
        console.log('   Código:', error.code);
        console.log('   Detalle:', error.detail);
    } finally {
        await client.end();
        console.log('🔌 Conexión cerrada');
    }
}

checkDatabase();
