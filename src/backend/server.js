// src/backend/server.js - Vercel handler + CORS GH-Pages + log token
const express = require('express');
const app = express();

// 1️⃣ CORS explícito para GitHub Pages
app.use((req, res, next) => {
  const allowed = 'https://mizulegendsstudios.github.io'; // <-- tu GH Pages
  res.header('Access-Control-Allow-Origin', allowed);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 2️⃣ Log del Authorization que recibe Vercel
app.use((req, res, next) => {
  console.log('🔐 Authorization header:', req.headers.authorization);
  next();
});

// 3️⃣ Body parser
app.use(express.json());

// 4️⃣ Logging general
app.use((req, res, next) => {
  console.log(`🔧 ${req.method} ${req.path} - Headers:`, req.headers);
  next();
});

// 5️⃣ Cargar rutas con try/catch
try {
  console.log('🔧 Cargando /api/auth');
  app.use('/api/auth', require('./api/routes/auth'));
  console.log('✅ /api/auth cargado');
} catch (e) {
  console.error('❌ /api/auth falló:', e.message);
}

try {
  console.log('🔧 Cargando /api/notes');
  app.use('/api/notes', require('./api/routes/notes'));
  console.log('✅ /api/notes cargado');
} catch (e) {
  console.error('❌ /api/notes falló:', e.message);
}

// 6️⃣ Endpoints de debug
app.get('/api/health', (_, res) => res.json({ status: 'OK', ts: new Date() }));
app.get('/api/debug', (_, res) => res.json({ msg: 'Vercel handler OK', ts: new Date() }));

// 7️⃣ 404 catch-all
app.use('*', (req, res) => res.status(404).json({ error: 'Not found', path: req.originalUrl }));

// 8️⃣ Safe-guards
process.on('uncaughtException', (e) => console.error('❌ uncaught:', e));
process.on('unhandledRejection', (r) => console.error('❌ unhandled:', r));

module.exports = app;