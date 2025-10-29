// api/src/server.ts - Servidor KATANA v7 (Hono + WebSocket binario)
// ÚLTIMO CAMBIO: 2025-10-28 - KATANA v7 - WebSocket real-time para notas
// IMPORTANCIA: VITAL - Entry point del backend, maneja conexiones WebSocket binarias

import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { handleWS } from './core/engine.js';
import { healthRouter } from './core/health.js';

const app = new Hono();

// Health check para monitoreo
app.route('/api', healthRouter);

// Crear servidor HTTP
const server = createServer(app);

// WebSocket Server para comunicación binaria
const wss = new WebSocketServer({ 
  server, 
  path: '/ws',
  // Configuración optimizada para baja latencia
  perMessageDeflate: false,
  maxPayload: 64 * 1024 // 64KB máximo por mensaje
});

// Manejar conexiones WebSocket
wss.on('connection', handleWS);

// Arrancar servidor
const port = parseInt(process.env.PORT || '3001');
serve({ 
  fetch: app.fetch, 
  port,
  // Configuración para producción
  hostname: '0.0.0.0'
}, (info) => {
  console.log(`🗡️ KATANA v7 server listening on http://localhost:${info.port}`);
  console.log(`🔗 WebSocket endpoint: ws://localhost:${info.port}/ws`);
});