// api/src/plugins/supabase.ts - Plugin de autenticación para KATANA v7
// ÚLTIMO CAMBIO: 2025-10-28 - Verificación JWT para WebSocket binario
// IMPORTANCIA: CRÍTICO - Valida tokens de Supabase en tiempo real

import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

// Cliente de Supabase para verificación de tokens
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

/**
 * Verifica un JWT de Supabase y retorna el usuario
 * @param token - JWT desde el header Authorization
 * @returns Usuario autenticado o null
 */
export async function verifyJWT(token: string): Promise<User | null> {
  if (!token || token.length < 10) {
    console.log('⚠️ Token inválido (muy corto)');
    return null;
  }

  try {
    console.log('🔑 Verificando token con Supabase...');
    
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.log('❌ Token inválido:', error.message);
      return null;
    }
    
    if (!data.user) {
      console.log('⚠️ No se encontró usuario en el token');
      return null;
    }
    
    console.log('✅ Token válido para usuario:', data.user.email);
    return data.user;
    
  } catch (error) {
    console.error('❌ Error verificando token:', error);
    return null;
  }
}

/**
 * Obtiene información básica del usuario
 * @param user - Usuario de Supabase
 * @returns Información resumida
 */
export function getUserInfo(user: User) {
  return {
    id: user.id,
    email: user.email,
    username: user.user_metadata?.username || user.email.split('@')[0]
  };
}