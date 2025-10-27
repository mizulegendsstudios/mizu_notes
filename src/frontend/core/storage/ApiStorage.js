// src/frontend/core/storage/ApiStorage.js - API Storage con autenticación Supabase
// ÚLTIMO CAMBIO: 2025-10-28 - Solución Montaña Maestra - Reparar obtención de tokens
// IMPORTANCIA: CRÍTICO para sincronización backend/frontend + autenticación
// COMPATIBILIDAD: GitHub Pages, Vercel, Supabase Auth, Fetch API
// RAZÓN DEL CAMBIO: Resolver "NO HAY TOKEN" + mejor manejo de autenticación

import { Note } from '../../../shared/types/Note.js';
import { notificationService } from '../services/NotificationService.js';

export class ApiStorage {
    constructor() {
        // 🌟 URL del backend en Vercel - CRÍTICO para producción
        this.baseURL = 'https://mizu-notes-git-gh-pages-mizulegendsstudios-admins-projects.vercel.app/api';
        this.isOnline = false;
        this.supabaseClient = null;
        console.log('🚀 ApiStorage Montaña Maestra - URL:', this.baseURL);
    }

    /**
     * ESTABLECER CLIENTE SUPABASE - CRÍTICO para autenticación
     * @param {Object} supabase - Cliente de Supabase
     * RAZÓN: Sin el cliente, no podemos manejar autenticación correctamente
     */
    setSupabaseClient(supabase) {
        this.supabaseClient = supabase;
        console.log('🔐 Supabase client configurado en ApiStorage');
        
        // Verificar sesión actual inmediatamente
        this.checkCurrentSession();
    }

    /**
     * VERIFICAR SESIÓN ACTUAL - Diagnóstico de autenticación
     * RAZÓN: Identificar por qué no hay token en localStorage
     */
    async checkCurrentSession() {
        if (!this.supabaseClient) {
            console.warn('⚠️ Supabase client no configurado - no se puede verificar sesión');
            return;
        }

        try {
            const { data: { session }, error } = await this.supabaseClient.auth.getSession();
            
            if (error) {
                console.error('❌ Error obteniendo sesión:', error);
                return;
            }

            if (session) {
                console.log('✅ Sesión activa encontrada:', {
                    user: session.user.email,
                    expires: new Date(session.expires_at * 1000),
                    token: session.access_token.substring(0, 20) + '...'
                });
                
                // Forzar guardado en localStorage por si acaso
                this.forceTokenSave(session.access_token);
            } else {
                console.log('ℹ️ No hay sesión activa - usuario necesita login');
                this.showAuthHelp();
            }
        } catch (error) {
            console.error('❌ Error en checkCurrentSession:', error);
        }
    }

    /**
     * FORZAR GUARDADO DE TOKEN - Solución para "NO HAY TOKEN"
     * @param {string} token - Token de acceso de Supabase
     * RAZÓN: Asegurar que el token se guarda en localStorage correctamente
     */
    forceTokenSave(token) {
        try {
            const tokenData = {
                access_token: token,
                token_type: 'bearer',
                expires_in: 3600,
                expires_at: Math.floor(Date.now() / 1000) + 3600,
                refresh_token: 'forced-save'
            };
            
            localStorage.setItem('supabase.auth.token', JSON.stringify(tokenData));
            console.log('💾 Token forzado en localStorage');
        } catch (error) {
            console.error('❌ Error forzando token:', error);
        }
    }

    /**
     * MOSTRAR AYUDA DE AUTENTICACIÓN - Guía para usuario
     * RAZÓN: Asistir al usuario cuando no hay token
     */
    showAuthHelp() {
        console.log(`
🔐 AYUDA DE AUTENTICACIÓN - MONTANA MAESTRA 🔐

PROBLEMA: No se encontró token de autenticación

SOLUCIONES:
1. ✅ Asegúrate de que el usuario hizo login correctamente
2. ✅ Verifica que Supabase Auth esté configurado en el frontend
3. ✅ Revisa la consola por errores de autenticación
4. ✅ Ejecuta en consola: localStorage.getItem('supabase.auth.token')

SI PERSISTE:
- Recarga la página
- Haz login nuevamente
- Verifica las variables de entorno de Supabase
        `);
    }

    /**
     * OBTENER HEADERS DE AUTENTICACIÓN - Método MEJORADO
     * @returns {Object} Headers con token de autorización
     * RAZÓN DEL CAMBIO: Búsqueda más agresiva y diagnóstica de tokens
     */
    getAuthHeaders() {
        console.log('🔍 Buscando token en localStorage...');
        
        // 🔍 BÚSQUEDA EXHAUSTIVA DE TOKENS
        const tokenSources = [
            'supabase.auth.token',
            'sb-mizunotes-auth-token', // Posible nuevo formato
            'supabase.auth.session',
            'sb-auth-token',
            'supabase-token'
        ];

        let foundToken = null;
        let source = '';

        for (const key of tokenSources) {
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    console.log(`📁 Encontrado en ${key}:`, data.substring(0, 50) + '...');
                    const parsed = JSON.parse(data);
                    
                    if (parsed?.access_token) {
                        foundToken = parsed.access_token;
                        source = key;
                        break;
                    } else if (typeof parsed === 'string' && parsed.length > 100) {
                        // Posiblemente el token directo
                        foundToken = parsed;
                        source = key + ' (raw)';
                        break;
                    }
                }
            } catch (error) {
                console.log(`❌ Error parseando ${key}:`, error.message);
            }
        }

        if (!foundToken) {
            console.warn('⚠️ NO SE ENCONTRÓ NINGÚN TOKEN VÁLIDO');
            console.log('📋 Keys en localStorage:', Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)));
            
            return { 
                'Content-Type': 'application/json',
                'X-Auth-Status': 'NO_TOKEN'
            };
        }

        console.log(`✅ Token encontrado en: ${source}`, foundToken.substring(0, 20) + '...');
        
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${foundToken}`,
            'X-Auth-Source': source,
            'X-Auth-Status': 'TOKEN_FOUND'
        };
    }

    /**
     * REALIZAR PETICIÓN HTTP MEJORADA - Con diagnóstico completo
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} options - Opciones de la petición
     * @returns {Promise<Object>} Respuesta del servidor
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = this.getAuthHeaders();
        
        console.log('🌐 [Montaña Maestra] Request:', {
            url,
            method: options.method || 'GET',
            hasToken: headers.Authorization ? 'SI' : 'NO',
            authSource: headers['X-Auth-Source'] || 'N/A'
        });

        try {
            const response = await fetch(url, {
                method: options.method || 'GET',
                headers: { ...headers, ...options.headers },
                body: options.body ? JSON.stringify(options.body) : undefined,
                credentials: 'include'
            });

            console.log('📡 Response:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                headers: Object.fromEntries(response.headers)
            });

            // Manejo específico de errores HTTP
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error response:', errorText);
                
                if (response.status === 401) {
                    console.error('🔐 Error 401: Token inválido o expirado');
                    this.handleAuthError();
                    throw new Error('UNAUTHORIZED');
                }
                
                if (response.status === 403) {
                    console.error('🚫 Error 403: Sin permisos');
                    throw new Error('FORBIDDEN');
                }
                
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Server response OK:', result);
            return result;
            
        } catch (error) {
            console.error('💥 Fetch error:', error);
            
            if (error.message === 'UNAUTHORIZED') {
                this.handleAuthError();
            }
            
            if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                console.log('🌐 Servidor offline - usando modo local');
                this.isOnline = false;
                throw new Error('OFFLINE');
            }
            
            throw error;
        }
    }

    /**
     * MANEJAR ERROR DE AUTENTICACIÓN - Limpieza y notificación
     * RAZÓN: Limpiar estado cuando el token es inválido
     */
    handleAuthError() {
        console.log('🧹 Limpiando tokens inválidos...');
        this.clearSupabaseTokens();
        
        // Mostrar notificación al usuario
        notificationService.error(
            'Sesión expirada', 
            'Por favor, inicia sesión nuevamente'
        );
        
        // Intentar redirigir a login si es posible
        if (this.supabaseClient) {
            this.supabaseClient.auth.signOut();
        }
    }

    // ... (los demás métodos permanecen igual que en tu versión actual)
    // getNotes, saveNotes, getLocalNotes, etc.

    /**
     * VERIFICAR CONEXIÓN MEJORADA - Con diagnóstico completo
     * @returns {Promise<boolean>} true si está online
     */
    async checkConnection() {
        try {
            console.log('🔌 [Montaña Maestra] Verificando conexión...');
            const result = await this.makeRequest('/health');
            console.log('✅ Servidor conectado:', result);
            this.isOnline = true;
            
            // Probar autenticación si hay token
            const headers = this.getAuthHeaders();
            if (headers.Authorization) {
                console.log('🔐 Probando autenticación...');
                const authTest = await this.makeRequest('/debug/auth-test');
                console.log('✅ Autenticación funcionando:', authTest);
            }
            
            return true;
        } catch (error) {
            console.log('⚠️ Servidor offline:', error.message);
            this.isOnline = false;
            return false;
        }
    }
}

export const apiStorage = new ApiStorage();