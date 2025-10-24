// src/backend/api/routes/index.js - VERSIÓN CORREGIDA

const express = require('express');
const router = express.Router();

// Importar las rutas específicas (usando CommonJS)
const notesRoutes = require('./notes');
const authRoutes = require('./auth');

// Montar las rutas bajo el prefijo /api
// El prefijo /api ya se añade en server.js con app.use('/api', indexRoutes)
// Así que aquí solo montamos /auth y /notes
router.use('/auth', authRoutes);
router.use('/notes', notesRoutes);

console.log('✅ Rutas de API configuradas: /api/auth, /api/notes');

// Exportar el router para que server.js pueda usarlo
module.exports = router;