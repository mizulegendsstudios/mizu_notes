// src/backend/middleware/auth.js - Middleware de autenticación con Supabase
// ÚLTIMO CAMBIO: 2025-10-28 - Solución Reina Violeta - UUID real de Supabase
// IMPORTANCIA: CRÍTICO para seguridad - valida tokens de Supabase Auth

const { supabase } = require('../../lib/supabase');

async function authMiddleware(req, res, next) {
  try {
    // Permitir OPTIONS para CORS preflight
    if (req.method === 'OPTIONS') return res.status(200).send();

    // Extraer token del header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Falta token' });
    }

    const token = authHeader.substring(7);
    
    // Verificar con Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log('❌ Token inválido:', error?.message);
      return res.status(401).json({ error: 'Token inválido' });
    }

    // ✅ Usuario REAL de Supabase - UUID que va en notes.user_id
    // RAZÓN: Así garantizamos que cada nota pertenece al usuario autenticado
    req.user = {
      id: user.id,               // UUID real de Supabase
      email: user.email,
      username: user.user_metadata?.username || user.email.split('@')[0]
    };

    next();
  } catch (err) {
    console.error('❌ Auth middleware:', err);
    res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = authMiddleware;