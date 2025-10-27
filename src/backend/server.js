// src/backend/server.js - Handler principal de Vercel + Express
// ÚLTIMO CAMBIO: 2025-10-28 - Solución Reina Violeta - CORS exacto para GitHub Pages
// IMPORTANCIA: Vital para Vercel (entry point), Express (servidor), CORS (seguridad cross-origin)

const express = require('express');
const app = express();

// 🟣 CORS REAL para GitHub Pages - Solución Reina Violeta
// DOMINIO REAL: https://mizulegendsstudios.github.io/mizu_notes/
// RAZÓN: El navegador bloquea requests cross-origin sin estos headers exactos
app.use((req, res, next) => {
  // ⚠️ CRÍTICO: Debe coincidir EXACTAMENTE con tu URL de GitHub Pages
  const allowedOrigin = 'https://mizulegendsstudios.github.io/mizu_notes/';
  
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  
  // Preflight request - importante para POST/PUT/DELETE
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 🔐 LOG DEL TOKEN - Diagnóstico para Vercel
// RAZÓN: Vercel Functions no muestran headers por defecto en logs
// IMPORTANCIA: Vital para debuggear autenticación en producción
app.use((req, res, next) => {
  console.log('🔐 Authorization:', req.headers.authorization);
  next();
});

// Body parser - ESENCIAL para JSON
// IMPORTANCIA: Necesario para req.body en POST/PUT
app.use(express.json());

// Logging general - UTIL para debug
app.use((req, res, next) => {
  console.log(`🔧 ${req.method} ${req.path}`);
  next();
});

// Rutas con manejo de errores - CRÍTICO para estabilidad
// IMPORTANCIA: Evita crash de Vercel si una ruta falla
try {
  app.use('/api/auth', require('./api/routes/auth'));
  app.use('/api/notes', require('./api/routes/notes'));
} catch (e) {
  console.error('❌ Error cargando rutas:', e);
}

// Endpoints de debug - ÚTILES para health checks
app.get('/api/health', (_, res) => res.json({ status: 'OK', ts: new Date() }));
app.get('/api/debug', (_, res) => res.json({ msg: 'Vercel handler OK', ts: new Date() }));

// 404 handler - BUENA PRÁCTICA
app.use('*', (req, res) => res.status(404).json({ error: 'Not found' }));

// Safe-guards - CRÍTICO para Node.js
process.on('uncaughtException', (e) => console.error('❌ uncaught:', e));
process.on('unhandledRejection', (r) => console.error('❌ unhandled:', r));

module.exports = app;