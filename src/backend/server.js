const express = require('express');
const cors = require('cors');

const app = express();

// 🔧 CORS COMPLETO - TEMPORAL PARA DESARROLLO
// ⚠️ NOTA: En producción deberíamos restringir los orígenes permitidos
// ⚠️ RAZÓN: Actualmente permite cualquier origen (*) para debugging
app.use(cors({
    origin: '*', // TEMPORAL - Cambiar a dominio específico en producción
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

// 🔧 IMPORTANTE: AGREGAR RUTAS DE LA API
// ⚠️ PROBLEMA ANTERIOR: Habíamos quitado estas rutas por conflictos de CORS
// ✅ SOLUCIÓN ACTUAL: Las rutas están en archivos separados y CORS está configurado
// ⚠️ NOTA: Si falla, puede ser porque los archivos de rutas no existen o tienen errores
app.use('/api/auth', require('./api/routes/auth'));
app.use('/api/notes', require('./api/routes/notes'));

// 🔧 ENDPOINTS DE DEBUG - MANTENER PARA VERIFICACIÓN
// ✅ PROPÓSITO: Verificar que el servidor está ejecutando la versión correcta
app.get('/api/debug', (req, res) => {
    console.log('🔧 DEBUG ENDPOINT - Headers:', req.headers);
    res.json({
        success: true,
        message: 'DEBUG - Server is running correct version',
        timestamp: new Date().toISOString(),
        origin: req.headers.origin,
        userAgent: req.headers['user-agent'],
        cors: 'enabled'
    });
});

// ✅ HEALTH CHECK - Para monitoreo y verificación básica
app.get('/api/health', (req, res) => {
    console.log('🔧 HEALTH CHECK - Origin:', req.headers.origin);
    res.json({ 
        status: 'OK', 
        message: 'Mizu Notes API - CORRECT VERSION',
        timestamp: new Date().toISOString(),
        version: '2.0.0 - CORS FIXED'
    });
});

// 🔧 MANEJO DE RUTAS NO ENCONTRADAS
// ✅ PROPÓSITO: Proporcionar mejor feedback cuando una ruta no existe
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        message: 'Verifica que la ruta esté correctamente configurada'
    });
});

module.exports = app;