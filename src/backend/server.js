// src/backend/server.js - VERSIÓN COMMONJS PARA VERCEL
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// CORS para todos los orígenes
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// HEALTH CHECK - RUTA PRINCIPAL
app.get('/api/health', (req, res) => {
    console.log('✅ Health check recibido desde:', req.headers.origin);
    res.json({ 
        status: 'OK', 
        message: 'Mizu Notes API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        cors: 'enabled'
    });
});

// Health check legacy
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Mizu Notes API (legacy endpoint)',
        timestamp: new Date().toISOString()
    });
});

// TEST CORS
app.get('/api/test-cors', (req, res) => {
    res.json({ 
        success: true,
        message: '✅ CORS funcionando correctamente!',
        origin: req.headers.origin,
        timestamp: new Date().toISOString()
    });
});

// RUTAS DE NOTAS PÚBLICAS
app.get('/api/notes', (req, res) => {
    console.log('📝 GET /api/notes recibido');
    res.json({
        success: true,
        data: [
            {
                id: 'note-1',
                title: 'Bienvenido a Mizu Notes',
                content: 'Esta es tu primera nota del servidor. ¡Funciona! 🎉',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                version: 1
            },
            {
                id: 'note-2', 
                title: 'Características',
                content: '• Sincronización en tiempo real\n• Almacenamiento offline\n• Interfaz moderna',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                version: 1
            }
        ]
    });
});

app.post('/api/notes', (req, res) => {
    const { title, content } = req.body;
    console.log('📝 POST /api/notes:', title);
    
    const newNote = {
        id: 'note-' + Date.now(),
        title: title || 'Nueva nota',
        content: content || 'Contenido de la nota',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1
    };
    
    res.json({
        success: true,
        data: newNote,
        message: 'Nota creada correctamente'
    });
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: '🚀 Mizu Notes API Server',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET /api/health',
            'GET /api/test-cors', 
            'GET /api/notes',
            'POST /api/notes'
        ]
    });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        path: req.originalUrl,
        availableRoutes: [
            '/api/health',
            '/health',
            '/api/test-cors',
            '/api/notes',
            '/'
        ]
    });
});

// Manejo de errores
app.use((error, req, res, next) => {
    console.error('❌ Error:', error);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Something went wrong'
    });
});

// Export para Vercel
module.exports = app;