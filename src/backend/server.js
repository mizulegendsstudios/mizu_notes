// src/backend/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config/environment.js';
import { db } from './database/connection.js';

const app = express();

// Middleware de seguridad
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
    origin: [
        'https://mizulegendsstudios.github.io',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Demasiadas solicitudes desde esta IP'
});
app.use(limiter);

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const dbHealthy = await db.healthCheck();
        res.status(dbHealthy ? 200 : 503).json({
            status: dbHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            database: dbHealthy ? 'connected' : 'disconnected',
            environment: config.nodeEnv
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// Ruta de prueba de base de datos
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

// Ruta de información del sistema
app.get('/api/info', (req, res) => {
    res.json({
        name: 'Mizu Notes API',
        version: '1.0.0',
        environment: config.nodeEnv,
        timestamp: new Date().toISOString()
    });
});

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
        available: ['/health', '/api/test-db', '/api/info']
    });
});

// Iniciar servidor
const PORT = config.port;
app.listen(PORT, () => {
    console.log(\🚀 Servidor Mizu Notes ejecutándose en puerto \\);
    console.log(\📊 Environment: \\);
    console.log(\🌐 Health check: http://localhost:\/health\);
    console.log(\🗄️  DB test: http://localhost:\/api/test-db\);
});

// Manejo graceful de shutdown
process.on('SIGINT', async () => {
    console.log('\\n🛑 Cerrando servidor...');
    await db.close();
    process.exit(0);
});

export default app;
// ACTUALIZAR src/backend/server.js - Agregar después de los middlewares:

// Importar y configurar rutas
import { setupRoutes } from './api/routes/index.js';
setupRoutes(app);
