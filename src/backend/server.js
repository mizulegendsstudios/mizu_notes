// src/backend/server.js - VERSIÓN CORREGIDA
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment.js';
import { db } from './database/connection.js';
import { setupRoutes } from './api/routes/index.js';

const app = express();

// Middleware de seguridad
app.use(helmet());
app.use(cors({
    origin: [
        'https://mizulegendsstudios.github.io',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:3000'
    ],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // límite de 100 requests por ventana
});
app.use(limiter);

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
    const dbHealthy = await db.healthCheck();
    res.status(dbHealthy ? 200 : 503).json({
        status: dbHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        database: dbHealthy ? 'connected' : 'disconnected',
        environment: config.nodeEnv
    });
});

// Info endpoint para desarrollo
app.get('/api/info', (req, res) => {
    res.json({
        name: 'Mizu Notes API',
        version: '1.0.0',
        environment: config.nodeEnv,
        timestamp: new Date().toISOString(),
        features: {
            authentication: true,
            notes: true,
            sync: true
        }
    });
});

// Test endpoint para base de datos
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await db.query('SELECT version()');
        res.json({
            success: true,
            database: 'PostgreSQL connected',
            version: result.rows[0].version
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Database connection failed',
            message: error.message
        });
    }
});

// Configurar rutas de la API
setupRoutes(app);

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('❌ Error no manejado:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: config.isDevelopment ? err.message : 'Algo salió mal'
    });
});

// Ruta 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.originalUrl,
        available: ['/health', '/api/info', '/api/test-db', '/api/notes', '/api/auth']
    });
});

// Iniciar servidor
const PORT = config.port || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor Mizu Notes ejecutándose en puerto ${PORT}`);
    console.log(`📊 Environment: ${config.nodeEnv}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    console.log(`🗄️  DB test: http://localhost:${PORT}/api/test-db`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
    console.log(`📝 Notes endpoints: http://localhost:${PORT}/api/notes`);
});

// Manejo graceful de shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Cerrando servidor...');
    await db.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Cerrando servidor (SIGTERM)...');
    await db.close();
    process.exit(0);
});

export default app;