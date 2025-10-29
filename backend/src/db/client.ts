// api/src/db/client.ts - Cliente de base de datos con Drizzle ORM
// ÚLTIMO CAMBIO: 2025-10-28 - KATANA v7 - Conexión a Neon con Drizzle ORM
// IMPORTANCIA: CRÍTICO - Punto de entrada a PostgreSQL (Neon) para todas las operaciones

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema.js';

// Validación de variables de entorno
if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL no está definida en las variables de entorno');
}

// Crear cliente de conexión a Neon
const sql = neon(process.env.DATABASE_URL, {
  // Configuración optimizada para serverless
  fullResults: true,
  fetchOptions: {
    // Timeout de 30 segundos para queries largas
    timeout: 30000,
  }
});

// Crear instancia de Drizzle con el esquema
export const db = drizzle(sql, { 
  schema,
  logger: process.env.NODE_ENV === 'development' // Solo log en desarrollo
});

// Función de utilidad para verificar conexión
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    console.log('🔍 Verificando conexión a PostgreSQL...');
    const result = await db.select().from(schema.notes).limit(1);
    console.log('✅ Conexión a PostgreSQL exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a PostgreSQL:', error);
    return false;
  }
}

// Exportar tipos útiles
export type { Note, NewNote } from './schema.js';
export { notes } from './schema.js';