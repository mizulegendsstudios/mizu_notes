// src/backend/lib/supabase.js
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/environment.js'; // ← Cambiar a named import

export const supabase = createClient(
    config.supabaseUrl, // ← Ahora debería funcionar
    config.supabaseKey,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            flowType: 'pkce'
        },
        global: {
            headers: {
                'X-Client-Info': 'mizu-notes-backend'
            }
        }
    }
);

// Función para verificar tokens
export async function verifyToken(token) {
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error) {
            console.error('Error verificando token:', error.message);
            return null;
        }
        
        return user;
    } catch (error) {
        console.error('Error en verifyToken:', error);
        return null;
    }
}

// Función para crear usuario manualmente (para desarrollo)
export async function createUser(email, password) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: email.split('@')[0]
                }
            }
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creando usuario:', error.message);
        throw error;
    }
}

