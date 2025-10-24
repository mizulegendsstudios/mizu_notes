// src/backend/api/routes/index.js - VERSIÓN CORREGIDA
const express = require('express');
const router = express.Router();

// Importar rutas
const authRoutes = require('./auth');
const notesRoutes = require('./notes');

// 🔧 MANEJAR OPTIONS PARA /api
router.options('/', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).send();
});

// Ruta de información de API
router.get('/', (req, res) => {
    res.json({
        message: 'Mizu Notes API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth/*',
            notes: '/api/notes/*',
            health: '/api/health',
            info: '/api/info'
        }
    });
});

// Usar rutas
router.use('/auth', authRoutes);
router.use('/notes', notesRoutes);

module.exports = router;