// src/backend/server.js - VERSIÓN ULTRA SIMPLE QUE SÍ FUNCIONE
const express = require('express');
const cors = require('cors');

const app = express();

// CORS PARA TODOS
app.use(cors());

// Middleware básico
app.use(express.json());

// HEALTH CHECK - ESTO DEBE FUNCIONAR
app.get('/api/health', (req, res) => {
    console.log('🔧 Health check recibido');
    res.json({ 
        status: 'OK', 
        message: 'Mizu Notes API is running',
        timestamp: new Date().toISOString(),
        cors: 'enabled'
    });
});

// TEST CORS
app.get('/api/test-cors', (req, res) => {
    res.json({ 
        success: true,
        message: '✅ CORS funcionando!',
        origin: req.headers.origin,
        timestamp: new Date().toISOString()
    });
});

// NOTAS SIMPLES
app.get('/api/notes', (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 'note-1',
                title: '¡Funciona! 🎉',
                content: 'El servidor está respondiendo correctamente',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                version: 1
            }
        ]
    });
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: 'Mizu Notes API',
        status: 'running'
    });
});

// Manejo de errores
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        path: req.originalUrl
    });
});

// Export para Vercel
module.exports = app;