// src/backend/server.js - VERSIÓN COMPLETA CORREGIDA
const express = require('express');
const cors = require('cors');
const path = require('path');

// Importar rutas
const authRoutes = require('./api/routes/auth');
const notesRoutes = require('./api/routes/notes');
const indexRoutes = require('./api/routes/index');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔧 CORS COMPLETO - CONFIGURACIÓN MEJORADA
const allowedOrigins = [
    'https://mizulegendsstudios.github.io',
    'https://mizulegendsstudios.github.io/mizu_notes',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:8080',
    'https://mizu-notes-o96sirmqd-mizulegendsstudios-admins-projects.vercel.app'
];

// Middleware CORS principal
app.use(cors({
    origin: function (origin, callback) {
        // Permitir requests sin origin
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            console.log(`✅ CORS permitido para: ${origin}`);
            return callback(null, true);
        } else {
            console.log(`❌ CORS bloqueado para: ${origin}`);
            return callback(new Error('Not allowed by CORS'), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
    ],
    optionsSuccessStatus: 200
}));

// 🔧 MANEJAR PREFLIGHT OPTIONS PARA TODAS LAS RUTAS
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(200).send();
});

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
    next();
});

// 🔧 HEALTH CHECK EN /api/health
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Mizu Notes API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        cors: 'enabled',
        yourOrigin: req.headers.origin,
        allowedOrigins: allowedOrigins
    });
});

// Health check legacy en /health
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Mizu Notes API is running (legacy endpoint)',
        timestamp: new Date().toISOString()
    });
});

// Ruta de prueba CORS pública
app.get('/api/test-cors', (req, res) => {
    res.json({ 
        success: true,
        message: '✅ CORS test successful!',
        origin: req.headers.origin,
        method: req.method,
        timestamp: new Date().toISOString(),
        cors: 'working'
    });
});

// Ruta de información pública
app.get('/api/info', (req, res) => {
    res.json({
        name: 'Mizu Notes API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/api/health',
            auth: '/api/auth/*',
            notes: '/api/notes/*',
            test: '/api/test-cors'
        }
    });
});

// Usar rutas de la API
app.use('/api', indexRoutes);

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: 'Mizu Notes API Server',
        version: '1.0.0',
        status: 'running',
        documentation: 'Visit /api/info for more details'
    });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        availableRoutes: [
            '/api/health',
            '/health',
            '/api/info', 
            '/api/test-cors',
            '/api/auth/*',
            '/api/notes/*'
        ]
    });
});

// Manejo global de errores
app.use((error, req, res, next) => {
    console.error('Error global:', error);
    
    // Error de CORS
    if (error.message.includes('CORS')) {
        return res.status(403).json({ 
            error: 'CORS Error',
            message: 'Origin not allowed',
            yourOrigin: req.headers.origin,
            allowedOrigins: allowedOrigins
        });
    }
    
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
    });
});

module.exports = app;