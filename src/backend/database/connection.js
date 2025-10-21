// src/backend/database/connection.js
import pg from 'pg';
const { Pool } = pg;

export class Database {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.pool.on('connect', () => {
            console.log('✅ Conectado a PostgreSQL (Neon)');
        });

        this.pool.on('error', (err) => {
            console.error('❌ Error de conexión PostgreSQL:', err);
        });
    }

    async query(text, params) {
        const start = Date.now();
        try {
            const res = await this.pool.query(text, params);
            const duration = Date.now() - start;
            console.log(\📊 Query ejecutada en \ms: \\);
            return res;
        } catch (error) {
            console.error('❌ Error en query:', { text, params, error });
            throw error;
        }
    }

    async healthCheck() {
        try {
            await this.pool.query('SELECT 1');
            return true;
        } catch (error) {
            return false;
        }
    }

    async close() {
        await this.pool.end();
    }
}

export const db = new Database();
