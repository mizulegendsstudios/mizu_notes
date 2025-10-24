// src/backend/config/environment.js - VERSIÓN CORREGIDA
import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

export const config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    databaseUrl: process.env.DATABASE_URL,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_ANON_KEY,
    
    get isProduction() {
        return this.nodeEnv === 'production';
    },
    
    get isDevelopment() {
        return this.nodeEnv === 'development';
    }
};

// Validar variables requeridas
const requiredEnvVars = ['DATABASE_URL'];
if (config.isProduction) {
    requiredEnvVars.push('SUPABASE_URL', 'SUPABASE_ANON_KEY');
}

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.warn(`⚠️  Variable de entorno faltante: ${envVar}`);
    }
}