// src/backend/server.js - VERSIÓN SIMPLIFICADA SIN MIDDLEWARE PROBLEMÁTICO
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔧 CORS PERMITIENDO TODOS LOS ORÍGENES TEMPORALMENTE
app.use(cors({
    origin: true, // ⚡️ PERMITIR TODOS los orígenes
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
    next();
});

// 🔧 HEALTH CHECK PÚBLICO - SIN AUTENTICACIÓN
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Mizu Notes API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        cors: 'enabled',
        yourOrigin: req.headers.origin
    });
});

// Ruta de prueba CORS pública
app.get('/api/test-cors', (req, res) => {
    res.json({ 
        success: true,
        message: '✅ CORS test successful!',
        origin: req.headers.origin,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// 🔧 RUTAS PÚBLICAS DE PRUEBA - SIN AUTENTICACIÓN
app.get('/api/public/notes', (req, res) => {
    // Datos de ejemplo para probar
    res.json({
        success: true,
        data: [
            {
                id: 'test-note-1',
                title: 'Nota de prueba',
                content: 'Esta es una nota de prueba del servidor',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                version: 1
            }
        ]
    });
});

app.post('/api/public/notes', (req, res) => {
    const { title, content } = req.body;
    res.json({
        success: true,
        data: {
            id: 'new-note-' + Date.now(),
            title: title || 'Nueva nota',
            content: content || 'Contenido de prueba',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            version: 1
        }
    });
});

// Importar rutas (mantener compatibilidad)
const authRoutes = require('./api/routes/auth');
const notesRoutes = require('./api/routes/notes');
const indexRoutes = require('./api/routes/index');

// Usar rutas normales
app.use('/api', indexRoutes);

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: 'Mizu Notes API Server',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            public: [
                '/api/health',
                '/api/test-cors', 
                '/api/public/notes'
            ],
            protected: [
                '/api/auth/*',
                '/api/notes/*'
            ]
        }
    });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});

module.exports = app;