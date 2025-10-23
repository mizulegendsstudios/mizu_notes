import pkg from 'pg';
import { config } from 'dotenv';
config();

const { Client } = pkg;
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkNotes() {
    try {
        await client.connect();
        const result = await client.query('SELECT id, title, content, created_at FROM notes');
        
        console.log('📝 Notas en PostgreSQL:');
        result.rows.forEach((note, i) => {
            console.log(`   ${i+1}. "${note.title}" - ${note.content.substring(0, 50)}... - ${new Date(note.created_at).toLocaleString()}`);
        });
        console.log('Total:', result.rows.length, 'notas');
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkNotes();