// src/backend/server.js - Handler principal de Vercel + Express
// ÚLTIMO CAMBIO: 2025-10-28 - Solución Montaña Maestra - CORS universal + diagnóstico completo
// IMPORTANCIA: VITAL para Vercel (entry point), Express (servidor), CORS (seguridad)
// COMPATIBILIDAD: Node.js, Express, Vercel Functions, GitHub Pages, Supabase Auth
// RAZÓN DEL CAMBIO: Resolver "NO HAY TOKEN" + CORS universal + logging completo

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();

// 🌟 CONFIGURACIÓN SUPABASE - CRÍTICO para autenticación
// RAZÓN: Sin Supabase configurado, el middleware auth siempre falla
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// 🌐 CORS UNIVERSAL MEJORADO - Solución Montaña Maestra
// DOMINIO REAL: https://mizulegendsstudios.github.io
// RAZÓN: Permitir desarrollo + producción + debugging sin bloqueos
// IMPORTANCIA: VITAL para GitHub Pages (frontend) comunicarse con Vercel (backend)
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://mizulegendsstudios.github.io',
    'https://mizulegendsstudios.github.io/mizu-notes',
    'http://localhost:3000',
    'https://localhost:3000',
    'http://localhost:5173',
    'https://localhost:5173'
  ];
  
  const origin = req.headers.origin;
  const requestOrigin = allowedOrigins.includes(origin) ? origin : '*';
  
  res.header('Access-Control-Allow-Origin', requestOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 
    'Authorization, Content-Type, X-Requested-With, x-auth-token, x-client-info');
  
  // Preflight request - ESENCIAL para métodos complejos
  if (req.method === 'OPTIONS') {
    console.log('✈️ Preflight request permitido para:', origin);
    return res.status(200).send();
  }
  
  next();
});

// 🔐 LOGGING MEJORADO - Diagnóstico completo para producción
// RAZÓN: Vercel Functions oculta detalles críticos en logs por defecto
// IMPORTANCIA: VITAL para debuggear autenticación en producción
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('🏔️ [Montaña Maestra] Request:', {
    method: req.method,
    path: req.path,
    origin: req.headers.origin,
    authorization: authHeader ? `Bearer ${authHeader.substring(7, 20)}...` : 'NO TOKEN',
    timestamp: new Date().toISOString()
  });
  next();
});

// 📦 Body parser - ESENCIAL para JSON en POST/PUT
// RAZÓN: Express no parsea JSON por defecto
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 🩺 ENDPOINTS DE DIAGNÓSTICO MEJORADOS
// RAZÓN: Health checks + debugging sin autenticación
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '3.0.0 - Solución Montaña Maestra',
    environment: process.env.NODE_ENV || 'development',
    supabase: process.env.SUPABASE_URL ? 'CONFIGURADO' : 'NO CONFIGURADO'
  });
});

app.get('/api/debug/auth-test', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token requerido para prueba',
        received: authHeader || 'Nada',
        hint: 'Authorization: Bearer tu_token_supabase'
      });
    }

    const token = authHeader.substring(7);
    console.log('🔐 Probando token:', token.substring(0, 20) + '...');
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ 
        error: 'Token inválido en Supabase',
        supabase_error: error?.message,
        hint: 'Token puede estar expirado o mal formado'
      });
    }

    res.json({
      status: '✅ Token VÁLIDO',
      user: {
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username || 'No username'
      },
      token_info: {
        length: token.length,
        preview: token.substring(0, 20) + '...'
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error probando autenticación',
      details: error.message 
    });
  }
});

// 🛡️ MIDDLEWARE DE AUTENTICACIÓN MEJORADO
// RAZÓN: Validación robusta de tokens Supabase + mejor manejo de errores
async function authMiddleware(req, res, next) {
  try {
    // Excluir rutas públicas del middleware de auth
    const publicPaths = ['/health', '/debug', '/debug/auth-test'];
    if (publicPaths.some(path => req.path.includes(path))) {
      return next();
    }

    console.log('🔐 [Auth Middleware] Verificando:', req.path);
    
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ Token mal formado o ausente:', authHeader);
      return res.status(401).json({ 
        error: 'Formato de token incorrecto',
        hint: 'Usa: Authorization: Bearer tu_token_supabase',
        received: authHeader || 'Nada'
      });
    }

    const token = authHeader.substring(7);
    console.log('🔐 Token recibido:', token.substring(0, 20) + '...');
    
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log('❌ Supabase rechazó el token:', error?.message);
      return res.status(401).json({ 
        error: 'Token inválido o expirado',
        supabase_error: error?.message,
        hint: 'Inicia sesión nuevamente en el frontend'
      });
    }

    // ✅ Usuario autenticado correctamente
    req.user = {
      id: user.id,               // UUID de Supabase (para user_id en notas)
      email: user.email,
      username: user.user_metadata?.username || user.email.split('@')[0]
    };

    console.log('✅ Usuario autenticado:', req.user.email);
    next();
    
  } catch (error) {
    console.error('💥 Error en middleware auth:', error);
    res.status(500).json({ 
      error: 'Error interno de autenticación',
      message: error.message
    });
  }
}

// Aplicar middleware de autenticación
app.use('/api', authMiddleware);

// 🗂️ CARGAR RUTAS CON MANEJO DE ERRORES
// RAZÓN: Evitar crash de Vercel si hay error en rutas
try {
  app.use('/api/auth', require('./api/routes/auth'));
  app.use('/api/notes', require('./api/routes/notes'));
  console.log('✅ Rutas cargadas correctamente');
} catch (error) {
  console.error('❌ Error cargando rutas:', error);
  // No salir del proceso - permitir que otras funciones sigan trabajando
}

// 🚨 MANEJO DE ERRORES GLOBAL - CRÍTICO para producción
app.use((error, req, res, next) => {
  console.error('💥 Error global no manejado:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Contacta al administrador'
  });
});

// 404 handler - BUENA PRÁCTICA para API REST
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint no encontrado',
    path: req.path,
    available: ['/api/health', '/api/debug/auth-test', '/api/notes', '/api/auth']
  });
});

// 🛡️ SAFE-GUARDS PARA NODE.JS - EVITAR CRASH
process.on('uncaughtException', (error) => {
  console.error('🚨 uncaughtException:', error);
  // No salir - Vercel maneja el restart
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 unhandledRejection en:', promise, 'razón:', reason);
});

console.log('🏔️ Servidor Montaña Maestra inicializado - Listo para requests');

module.exports = app;