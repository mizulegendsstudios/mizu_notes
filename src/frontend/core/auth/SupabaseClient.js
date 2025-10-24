// src/frontend/core/auth/SupabaseClient.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configuración de Supabase - reemplaza con tus credenciales
const SUPABASE_URL = 'https://isjfnbzyoadoycqkesnr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzamZuYnp5b2Fkb3ljcWtlc25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMjM3NzYsImV4cCI6MjA3NTY5OTc3Nn0.SxwL0joEKeN26X7BcwetbnhU3O0OlWFl-LNz_HIVbYI'

// URL absoluta para GitHub Pages
const GITHUB_PAGES_URL = 'https://mizulegendsstudios.github.io/mizu_notes'

// Se crea el cliente de Supabase con la configuración de autenticación mejorada
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,       // Refresca el token automáticamente
    persistSession: true,         // Mantiene la sesión activa al recargar la página
    detectSessionInUrl: true,     // Detecta la sesión en la URL para callbacks de OAuth
    flowType: 'pkce',             // Usa el flujo PKCE para mayor seguridad en OAuth
    // redirectTo global para callbacks de autenticación
    redirectTo: `${GITHUB_PAGES_URL}/auth/callback.html`
  }
})

export class SupabaseAuth {
    constructor() {
        this.supabase = supabase
        this.user = null
        this.session = null
    }

    // Iniciar sesión con email y contraseña
    async signIn(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            })
            
            if (error) throw error
            
            this.user = data.user
            this.session = data.session
            
            // Disparar evento de login exitoso para sincronización
            window.dispatchEvent(new CustomEvent('mizu:userLoggedIn', {
                detail: { user: data.user }
            }));
            
            return { success: true, user: data.user }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Registrar nuevo usuario
    async signUp(email, password, name) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name
                    }
                }
            })
            
            if (error) throw error
            
            return { 
                success: true, 
                user: data.user,
                message: '¡Cuenta creada! Revisa tu email para confirmar.'
            }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // Login con proveedores OAuth (Google, GitHub)
    async signInWithProvider(provider) {
        try {
            const { data, error } = await this.supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    // URL absoluta para GitHub Pages
                    redirectTo: `${GITHUB_PAGES_URL}/auth/callback.html`
                }
            })
            
            if (error) throw error
            
            return { success: true, url: data.url }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // MEJORADO: Cerrar sesión con limpieza
    async signOut() {
        try {
            // Disparar evento antes de cerrar sesión
            window.dispatchEvent(new CustomEvent('mizu:userLoggingOut'));
            
            const { error } = await this.supabase.auth.signOut()
            if (error) throw error
            
            this.user = null
            this.session = null
            
            // Limpieza completa
            this.cleanupAfterLogout();
            
            return { success: true }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    cleanupAfterLogout() {
        // Limpiar datos específicos de usuario
        const userKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('mizu_')) {
                userKeys.push(key);
            }
        }
        
        userKeys.forEach(key => {
            if (!key.includes('mizuNotes-theme')) { // Preservar preferencias de tema
                localStorage.removeItem(key);
            }
        });
        
        console.log('✅ Sesión limpiada completamente');
    }

    // Verificar sesión actual
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await this.supabase.auth.getUser()
            if (error) throw error
            
            this.user = user
            return { success: true, user }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    // NUEVO: Verificar y restaurar sesión al cargar la app
    async initializeSession() {
        try {
            const { data: { session }, error } = await this.supabase.auth.getSession();
            
            if (error) throw error;
            
            if (session) {
                this.session = session;
                const { data: { user } } = await this.supabase.auth.getUser();
                this.user = user;
                
                // Disparar evento de sesión restaurada
                window.dispatchEvent(new CustomEvent('mizu:sessionRestored', {
                    detail: { user }
                }));
                
                return { success: true, user, session };
            }
            
            return { success: false, user: null, session: null };
        } catch (error) {
            console.error('Error inicializando sesión:', error);
            return { success: false, error: error.message };
        }
    }
}