// src/backend/middleware/auth.js - Middleware de autenticación con Supabase
// ÚLTIMO CAMBIO: 2025-10-28 - Solución Definitiva Híbrida - Mejor manejo de tokens y errores
// IMPORTANCIA: CRÍTICO para seguridad - valida tokens de Supabase Auth
// COMPATIBILIDAD: Supabase Auth, Express, Vercel Functions

const { supabase } = require('../../lib/supabase');

async function authMiddleware(req, res, next) {
  try {
    // Permitir OPTIONS para CORS preflight
    if (req.method === 'OPTIONS') return res.status(200).send();

    // Extraer token del header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ Falta token o formato incorrecto:', authHeader);
      return res.status(401).json({ 
        error: 'Falta token de autenticación',
        hint: 'Formato: Authorization: Bearer <token>'
      });
    }

    const token = authHeader.substring(7);
    
    // Verificar con Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log('❌ Token inválido:', error?.message || 'Usuario no encontrado');
      return res.status(401).json({ 
        error: 'Token inválido o expirado',
        hint: 'Por favor, inicia sesión nuevamente'
      });
    }

    // ✅ Usuario REAL de Supabase - UUID que va en notes.user_id
    // RAZÓN: Así garantizamos que cada nota pertenece al usuario autenticado
    req.user = {
      id: user.id,               // UUID real de Supabase
      email: user.email,
      username: user.user_metadata?.username || user.email.split('@')[0]
    };

    console.log('✅ Usuario autenticado:', req.user.email);
    next();
  } catch (err) {
    console.error('❌ Auth middleware error:', err);
    res.status(500).json({ 
      error: 'Error interno de autenticación',
      message: err.message
    });
  }
}

module.exports = authMiddleware;