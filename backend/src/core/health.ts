// api/src/core/health.ts - Health check + diagnóstico para KATANA v7
// ÚLTIMO CAMBIO: 2025-10-28 - Health check con diagnóstico de conexiones
// IMPORTANCIA: CRÍTICO - Monitoreo de salud del servidor y diagnóstico de problemas

import { Hono } from 'hono';
import { redis } from '../plugins/redis.js';

export const healthRouter = new Hono();

// Health check básico
healthRouter.get('/health', async (c) => {
  try {
    // Verificar conexión a Redis
    const redisPing = await redis.ping();
    
    return c.json({
      status: '✅ healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      redis: redisPing === 'PONG' ? 'connected' : 'disconnected',
      katana: {
        version: '7.0.0',
        mode: 'MOBA Ready',
        websocket: 'active'
      }
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return c.json({
      status: '❌ unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 503);
  }
});

// Diagnóstico de CORS (útil para debug)
healthRouter.get('/debug', (c) => {
  return c.json({
    message: '🔍 KATANA v7 Debug',
    headers: c.req.header(),
    origin: c.req.header('origin'),
    userAgent: c.req.header('user-agent'),
    timestamp: new Date().toISOString()
  });
});