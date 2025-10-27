// src/backend/server.js - Handler principal de Vercel + Express
// ÚLTIMO CAMBIO: 2025-10-28 - Solución Definitiva Híbrida - CORS flexible + diagnóstico mejorado
// IMPORTANCIA: Vital para Vercel (entry point), Express (servidor), CORS (seguridad cross-origin)
// COMPATIBILIDAD: Node.js, Express, Vercel Functions, GitHub Pages

const express = require('express');
const app = express();

// 🌟 CORS FLEXIBLE - Solución Definitiva Híbrida
// DOMINIO REAL: https://mizulegendsstudios.github.io/mizu-notes/
// RAZÓN: Permitir múltiples orígenes durante desarrollo y producción
// IMPORTANCIA: Vital para GitHub Pages (frontend) y Vercel (backend)
app.use((req, res, next) => {
  // Lista de orígenes permitidos para mayor flexibilidad
  const allowedOrigins = [
    'https://mizulegendsstudios.github.io/mizu-notes',
    'https://mizulegendsstudios.github.io',
    'http://localhost:3000',
    'https://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  
  // Verificar si el origen está en la lista de permitidos
  if (allowedOrigins.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Requested-With');
  
  // Preflight request - importante para POST/PUT/DELETE
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 🔐 LOG DETALLADO DEL TOKEN - Diagnóstico mejorado para Vercel
// RAZÓN: Vercel Functions no muestran headers por defecto en logs
// IMPORTANCIA: Vital para debuggear autenticación en producción
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('🔐 Authorization:', authHeader ? authHeader.substring(0, 20) + '...' : 'NONE');
  console.log('🌐 Origin:', req.headers.origin);
  console.log('📍 Path:', req.path);
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

// Endpoints de debug mejorados - ÚTILES para health checks
app.get('/api/health', (_, res) => res.json({ 
  status: 'OK', 
  ts: new Date(),
  version: '2.0.0 - Solución Definitiva Híbrida'
}));

app.get('/api/debug', (req, res) => {
  res.json({ 
    msg: 'Vercel handler OK', 
    ts: new Date(),
    headers: req.headers,
    origin: req.headers.origin
  });
});

// 404 handler - BUENA PRÁCTICA
app.use('*', (req, res) => res.status(404).json({ error: 'Not found' }));

// Safe-guards - CRÍTICO para Node.js
process.on('uncaughtException', (e) => console.error('❌ uncaught:', e));
process.on('unhandledRejection', (r) => console.error('❌ unhandled:', r));

module.exports = app;