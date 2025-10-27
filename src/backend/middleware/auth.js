// src/backend/middleware/auth.js - VERSIÓN REAL
const { supabase } = require('../../lib/supabase');

async function authMiddleware(req, res, next) {
  try {
    if (req.method === 'OPTIONS') return res.status(200).send();

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Falta token' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // ✅ Usuario REAL de Supabase
    req.user = {
      id: user.id,               // ← este es el UUID que debe ir en notes.user_id
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