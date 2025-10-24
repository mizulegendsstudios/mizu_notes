const express = require('express');
const cors = require('cors');

const app = express();

// 🔧 CORS COMPLETO - TEMPORAL PARA DESARROLLO
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

// 🔧 MIDDLEWARE DE LOGGING PARA DEBUG
app.use((req, res, next) => {
    console.log(`🔧 ${req.method} ${req.path} - Headers:`, req.headers);
    next();
});

// 🔧 IMPORTANTE: AGREGAR RUTAS CON MANEJO DE ERRORES
// ⚠️ PROBLEMA: Las rutas están causando un crash
// ✅ SOLUCIÓN: Agregar try/catch para ver el error específico
try {
    console.log('🔧 INTENTANDO CARGAR RUTA: /api/auth');
    app.use('/api/auth', require('./api/routes/auth'));
    console.log('✅ RUTA /api/auth CARGADA CORRECTAMENTE');
} catch (error) {
    console.error('❌ ERROR CARGANDO RUTA /api/auth:', error.message);
    console.error('❌ STACK TRACE:', error.stack);
}

try {
    console.log('🔧 INTENTANDO CARGAR RUTA: /api/notes');
    app.use('/api/notes', require('./api/routes/notes'));
    console.log('✅ RUTA /api/notes CARGADA CORRECTAMENTE');
} catch (error) {
    console.error('❌ ERROR CARGANDO RUTA /api/notes:', error.message);
    console.error('❌ STACK TRACE:', error.stack);
}

// 🔧 ENDPOINTS DE DEBUG - MANTENER PARA VERIFICACIÓN
app.get('/api/debug', (req, res) => {
    res.json({
        success: true,
        message: 'DEBUG - Server routes loaded with error handling',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Mizu Notes API - ERROR HANDLING VERSION',
        timestamp: new Date().toISOString()
    });
});

// 🔧 RUTA DE TEST SIMPLE PARA VERIFICAR QUE EL SERVIDOR FUNCIONA
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'TEST ROUTE - Server is running',
        routes: {
            auth: '/api/auth/*',
            notes: '/api/notes/*', 
            health: '/api/health',
            debug: '/api/debug'
        }
    });
});

// 🔧 MANEJO DE ERRORES GLOBAL
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});

// 🔧 MANEJO DE ERRORES NO CAPTURADOS
process.on('uncaughtException', (error) => {
    console.error('❌ UNCAUGHT EXCEPTION:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

module.exports = app;