// src/backend/server.js - VERSIÓN SIN AUTENTICACIÓN
const express = require('express');
const cors = require('cors');

const app = express();

// 🔧 CORS COMPLETO
app.use(cors({
    origin: [
        'https://mizulegendsstudios.github.io',
        'https://mizulegendsstudios.github.io/mizu_notes',
        'http://localhost:3000',
        'http://127.0.0.1:5500',
        'http://localhost:5500'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
    next();
});

// 🔧 HEALTH CHECK - SIN AUTENTICACIÓN
app.get('/api/health', (req, res) => {
    console.log('✅ Health check desde:', req.headers.origin);
    res.json({ 
        status: 'OK', 
        message: 'Mizu Notes API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        cors: 'enabled'
    });
});

// TEST CORS - SIN AUTENTICACIÓN
app.get('/api/test-cors', (req, res) => {
    res.json({ 
        success: true,
        message: '✅ CORS funcionando correctamente!',
        origin: req.headers.origin,
        timestamp: new Date().toISOString()
    });
});

// 🔧 NOTAS - SIN AUTENTICACIÓN
app.get('/api/notes', (req, res) => {
    console.log('📝 GET /api/notes desde:', req.headers.origin);
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
    console.log('📝 POST /api/notes:', title, 'desde:', req.headers.origin);
    
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

app.put('/api/notes/:id', (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    console.log('📝 PUT /api/notes/', id, 'desde:', req.headers.origin);
    
    res.json({
        success: true,
        data: {
            id: id,
            title: title || 'Nota actualizada',
            content: content || 'Contenido actualizado',
            updated_at: new Date().toISOString()
        },
        message: 'Nota actualizada correctamente'
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
            'POST /api/notes',
            'PUT /api/notes/:id'
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
            '/api/test-cors',
            '/api/notes',
            '/'
        ]
    });
});

module.exports = app;