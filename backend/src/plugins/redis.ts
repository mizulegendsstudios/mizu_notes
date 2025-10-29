// api/src/plugins/redis.ts - Plugin Redis para KATANA v7
// ÚLTIMO CAMBIO: 2025-10-28 - Upstash Redis serverless para cache y estado en memoria
// IMPORTANCIA: CRÍTICO - Cache de notas y estado de juego para baja latencia

import { Redis } from '@upstash/redis';

// Cliente Redis de Upstash (serverless)
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

/**
 * Verifica conexión con Redis
 * @returns true si está conectado
 */
export async function checkRedisConnection(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch (error) {
    console.error('❌ Error conectando a Redis:', error);
    return false;
  }
}

/**
 * Guarda notas en cache con TTL
 * @param key - Clave del cache (ej: "notes:user123")
 * @param data - Datos a guardar
 * @param ttl - Tiempo de vida en segundos (default: 60s)
 */
export async function setCache<T>(key: string, data: T, ttl: number = 60): Promise<void> {
  try {
    await redis.set(key, data, { ex: ttl });
    console.log(`💾 Guardado en cache: ${key} (TTL: ${ttl}s)`);
  } catch (error) {
    console.error(`❌ Error guardando cache ${key}:`, error);
  }
}

/**
 * Obtiene datos del cache
 * @param key - Clave del cache
 * @returns Datos o null si no existe
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key);
    if (data) {
      console.log(`✅ Cache hit: ${key}`);
    } else {
      console.log(`🔄 Cache miss: ${key}`);
    }
    return data;
  } catch (error) {
    console.error(`❌ Error leyendo cache ${key}:`, error);
    return null;
  }
}

/**
 * Elimina una clave del cache
 * @param key - Clave a eliminar
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key);
    console.log(`🗑️ Cache eliminado: ${key}`);
  } catch (error) {
    console.error(`❌ Error eliminando cache ${key}:`, error);
  }
}

/**
 * Guarda estado de juego temporal
 * @param gameId - ID del juego/sesión
 * @param state - Estado a guardar
 * @param ttl - Tiempo de vida (default: 300s)
 */
export async function setGameState(gameId: string, state: any, ttl: number = 300): Promise<void> {
  await setCache(`game:${gameId}`, state, ttl);
}

/**
 * Obtiene estado de juego
 * @param gameId - ID del juego/sesión
 * @returns Estado o null
 */
export async function getGameState(gameId: string): Promise<any | null> {
  return await getCache(`game:${gameId}`);
}