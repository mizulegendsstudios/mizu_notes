// src/backend/server.js - VERSIÓN CORREGIDA

const express = require('express');
const cors = require('cors');
const path = require('path');

// Importar rutas (usando CommonJS require)
const authRoutes = require('./api/routes/auth');
const notesRoutes = require('./api/routes/notes');
const indexRoutes = require('./api/routes/index');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔧 CONFIGURAR CORS PARA GITHUB PAGES
const allowedOrigins = [
    'https://mizulegendsstudios.github.io',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://localhost:5500'
];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir requests sin origin (como mobile apps o curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
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

// Rutas de la API
app.use('/api', indexRoutes);
// Nota: Las rutas /auth y /notes ya están montadas dentro de indexRoutes, 
// pero si prefieres montarlas por separado, también es válido.
// app.use('/api/auth', authRoutes);
// app.use('/api/notes', notesRoutes);

// Ruta de health check MEJORADA
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Ruta de health check en raíz también
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Mizu Notes API is running',
        timestamp: new Date().toISOString()
    });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        path: req.originalUrl
    });
});

// Manejo global de errores
app.use((error, req, res, next) => {
    console.error('Error global:', error);
    
    // Si es error de CORS
    if (error.message.includes('CORS')) {
        return res.status(403).json({ 
            error: 'CORS Error',
            message: 'Origin not allowed',
            allowedOrigins: allowedOrigins
        });
    }
    
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Mizu Notes API running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ CORS enabled for: ${allowedOrigins.join(', ')}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;