// src/backend/server.js - VERSIÓN COMPLETAMENTE LIMPIA SIN AUTENTICACIÓN
const express = require('express');
const cors = require('cors');

const app = express();

// 🔧 CORS COMPLETO - PERMITIR TODO
app.use(cors({
    origin: '*', // ⚡️ PERMITIR TODOS los orígenes
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 🔧 MANEJAR OPTIONS EXPLÍCITAMENTE
app.options('*', cors());

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
    console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
    next();
});

// 🔧 HEALTH CHECK - ABSOLUTAMENTE PÚBLICO
app.get('/api/health', (req, res) => {
    console.log('✅ Health check desde:', req.headers.origin);
    res.json({ 
        status: 'OK', 
        message: 'Mizu Notes API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        cors: 'fully enabled'
    });
});

// 🔧 TEST CORS - PÚBLICO
app.get('/api/test-cors', (req, res) => {
    res.json({ 
        success: true,
        message: '✅ CORS funcionando correctamente!',
        origin: req.headers.origin,
        timestamp: new Date().toISOString()
    });
});

// 🔧 NOTAS - COMPLETAMENTE PÚBLICAS
app.get('/api/notes', (req, res) => {
    console.log('📝 GET /api/notes desde:', req.headers.origin);
    res.json({
        success: true,
        data: [
            {
                id: 'note-server-1',
                title: '¡Desde el Servidor! 🎉',
                content: 'Esta nota viene directamente del backend funcionando correctamente.',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                version: 1
            },
            {
                id: 'note-server-2',
                title: 'CORS Resuelto',
                content: 'El problema de CORS ha sido solucionado completamente.',
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
        title: title || 'Nueva nota del servidor',
        content: content || 'Contenido de la nota',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1
    };
    
    res.json({
        success: true,
        data: newNote,
        message: 'Nota creada correctamente en el servidor'
    });
});

app.put('/api/notes/:id', (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    console.log('📝 PUT /api/notes/', id);
    
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
        message: '🚀 Mizu Notes API Server - CORS FIXED',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        cors: 'fully enabled'
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

// Manejo de errores
app.use((error, req, res, next) => {
    console.error('❌ Error:', error);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Something went wrong'
    });
});

console.log('🚀 Mizu Notes Server iniciado - Sin autenticación');
module.exports = app;