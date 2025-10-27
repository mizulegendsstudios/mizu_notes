// src/frontend/core/storage/ApiStorage.js - API Storage con autenticación Supabase
// ÚLTIMO CAMBIO: 2025-10-28 - Solución Definitiva Híbrida - Mejor gestión de tokens y errores
// IMPORTANCIA: CRÍTICO para sincronización backend/frontend + autenticación
// COMPATIBILIDAD: GitHub Pages, Vercel, Supabase Auth, Fetch API

import { Note } from '../../../shared/types/Note.js';
import { notificationService } from '../services/NotificationService.js';

export class ApiStorage {
    constructor() {
        // 🌟 URL del backend en Vercel - CRÍTICO que coincida con tu despliegue
        this.baseURL = 'https://mizu-notes-git-gh-pages-mizulegendsstudios-admins-projects.vercel.app/api';
        this.isOnline = false;
        console.log('🚀 ApiStorage con URL:', this.baseURL);
    }

    /**
     * Crea headers con autenticación de Supabase
     * @returns {Object} Headers con token de autorización
     */
    getAuthHeaders() {
        // 🔐 Múltiples fuentes para obtener el token de Supabase
        // RAZÓN: Supabase puede guardar el token en diferentes claves según la versión
        let token = null;
        
        // Intentar obtener el token de las diferentes claves posibles
        const authData = localStorage.getItem('supabase.auth.token');
        const sessionData = localStorage.getItem('supabase.auth.session');
        
        if (authData) {
            try {
                const parsed = JSON.parse(authData);
                token = parsed?.access_token;
            } catch (error) {
                console.error('❌ Error parseando authData:', error);
            }
        }
        
        if (!token && sessionData) {
            try {
                const parsed = JSON.parse(sessionData);
                token = parsed?.access_token;
            } catch (error) {
                console.error('❌ Error parseando sessionData:', error);
            }
        }
        
        // Último recurso: buscar directamente en localStorage
        if (!token) {
            // Buscar en todas las claves de localStorage que puedan contener el token
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.includes('supabase') && key.includes('token')) {
                    try {
                        const value = localStorage.getItem(key);
                        const parsed = JSON.parse(value);
                        if (parsed?.access_token) {
                            token = parsed.access_token;
                            console.log('🔐 Token encontrado en:', key);
                            break;
                        }
                    } catch (error) {
                        // Ignorar errores de parseo
                    }
                }
            }
        }
        
        if (!token) {
            console.warn('⚠️ No se encontró token de Supabase en localStorage');
            return { 'Content-Type': 'application/json' };
        }

        console.log('🔐 Token de Supabase obtenido:', token.substring(0, 10) + '...');
        
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    /**
     * Realiza petición HTTP al backend con autenticación
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} options - Opciones de la petición
     * @returns {Promise<Object>} Respuesta del servidor
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = this.getAuthHeaders();
        
        console.log('🌐 FETCH:', url);
        console.log('📋 Headers:', { ...headers, Authorization: headers.Authorization ? 'Bearer [TOKEN]' : 'None' });
        
        try {
            const response = await fetch(url, {
                method: options.method || 'GET',
                headers: { ...headers, ...options.headers },
                body: options.body ? JSON.stringify(options.body) : undefined,
                credentials: 'include' // 🔑 Importante para CORS con credenciales
            });

            console.log('📡 STATUS:', response.status);
            
            if (!response.ok) {
                // Manejo específico de errores HTTP
                if (response.status === 401) {
                    console.error('❌ Error 401: Token inválido o expirado');
                    notificationService.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
                    throw new Error('UNAUTHORIZED');
                }
                if (response.status === 403) {
                    console.error('❌ Error 403: Sin permisos');
                    throw new Error('FORBIDDEN');
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('✅ SERVER RESPONSE:', result);
            return result;
            
        } catch (error) {
            console.error('❌ FETCH ERROR:', error);
            
            // Manejo específico de errores de red
            if (error.message === 'UNAUTHORIZED') {
                // Limpiar token inválido
                this.clearSupabaseTokens();
                throw error;
            }
            
            if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                console.log('⚠️ Error de red - servidor offline');
                this.isOnline = false;
                throw new Error('OFFLINE');
            }
            
            throw error;
        }
    }

    /**
     * Limpia todos los tokens de Supabase del localStorage
     */
    clearSupabaseTokens() {
        // Limpiar todas las claves relacionadas con Supabase
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('supabase')) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('🧹 Tokens de Supabase limpiados:', keysToRemove.length);
    }

    /**
     * Obtiene notas del servidor con autenticación
     * @returns {Promise<Map>} Mapa de notas
     */
    async getNotes() {
        try {
            console.log('🔍 GETTING NOTES FROM SERVER...');
            
            const result = await this.makeRequest('/notes');
            console.log('✅ SERVER RESPONSE:', result);
            
            const notesMap = new Map();
            
            if (result.data && Array.isArray(result.data)) {
                result.data.forEach(noteData => {
                    const note = new Note(
                        noteData.id,
                        noteData.title,
                        noteData.content,
                        new Date(noteData.created_at),
                        new Date(noteData.updated_at),
                        noteData.version || 1
                    );
                    notesMap.set(note.id, note);
                    console.log('📄 LOADED NOTE:', note.title);
                });
            }
            
            console.log(`✅ LOADED ${notesMap.size} NOTES FROM SERVER`);
            this.saveNotesToLocalStorage(notesMap);
            this.isOnline = true;
            notificationService.success(`Cargadas ${notesMap.size} notas del servidor`);
            return notesMap;
            
        } catch (error) {
            console.error('❌ FAILED TO GET NOTES FROM SERVER:', error);
            
            // Si falla, usar notas locales como fallback
            if (error.message === 'OFFLINE') {
                notificationService.info('Usando notas locales (sin conexión)');
            } else if (error.message === 'UNAUTHORIZED') {
                notificationService.error('Por favor, inicia sesión nuevamente');
            } else {
                notificationService.error('Error al cargar notas del servidor');
            }
            
            return this.getLocalNotes();
        }
    }

    /**
     * Guarda notas en el servidor
     * @param {Map} notesMap - Mapa de notas a guardar
     * @returns {Promise<Array>} Resultado del guardado
     */
    async saveNotes(notesMap) {
        try {
            console.log('💾 SAVING NOTES TO SERVER...');
            
            // Convertir Map a array para enviar al servidor
            const notesArray = Array.from(notesMap.values()).map(note => ({
                id: note.id,
                title: note.title,
                content: note.content,
                created_at: note.createdAt,
                updated_at: note.updatedAt,
                version: note.version
            }));

            const result = await this.makeRequest('/notes', {
                method: 'POST',
                body: { notes: notesArray }
            });

            console.log('✅ NOTES SAVED TO SERVER:', result);
            this.saveNotesToLocalStorage(notesMap);
            this.isOnline = true;
            notificationService.success('Notas sincronizadas con el servidor');
            return result;
            
        } catch (error) {
            console.error('❌ Error saving notes:', error);
            
            // Fallback a localStorage
            this.saveNotesToLocalStorage(notesMap);
            this.isOnline = false;
            
            if (error.message === 'OFFLINE') {
                notificationService.info('Notas guardadas localmente (sin conexión)');
            } else if (error.message === 'UNAUTHORIZED') {
                notificationService.error('Por favor, inicia sesión para sincronizar');
            } else {
                notificationService.error('Error al sincronizar notas');
            }
            
            return [];
        }
    }

    /**
     * Obtiene notas desde localStorage (fallback)
     * @returns {Map} Mapa de notas locales
     */
    getLocalNotes() {
        try {
            const notesData = localStorage.getItem('mizu_notes');
            const notesMap = new Map();
            
            if (notesData) {
                const parsed = JSON.parse(notesData);
                if (Array.isArray(parsed)) {
                    parsed.forEach(noteData => {
                        const note = new Note(
                            noteData.id,
                            noteData.title,
                            noteData.content,
                            new Date(noteData.createdAt),
                            new Date(noteData.updatedAt),
                            noteData.version || 1
                        );
                        notesMap.set(note.id, note);
                    });
                }
            }
            
            console.log('📁 LOCAL NOTES:', notesMap.size);
            return notesMap;
        } catch (error) {
            console.error('❌ Error leyendo localStorage:', error);
            return new Map();
        }
    }

    /**
     * Guarda notas en localStorage (fallback)
     * @param {Map} notesMap - Mapa de notas a guardar localmente
     */
    saveNotesToLocalStorage(notesMap) {
        try {
            const notesArray = Array.from(notesMap.values()).map(note => ({
                id: note.id,
                title: note.title,
                content: note.content,
                createdAt: note.createdAt,
                updatedAt: note.updatedAt,
                version: note.version
            }));
            
            localStorage.setItem('mizu_notes', JSON.stringify(notesArray));
            console.log('💾 Saved to localStorage:', notesArray.length, 'notes');
        } catch (error) {
            console.error('❌ Error saving to localStorage:', error);
        }
    }

    /**
     * Verifica conexión con el servidor
     * @returns {Promise<boolean>} true si está online
     */
    async checkConnection() {
        try {
            console.log('🔌 CHECKING SERVER CONNECTION...');
            const result = await this.makeRequest('/health');
            console.log('✅ SERVER CONNECTED:', result.status);
            this.isOnline = true;
            notificationService.success('Conectado al servidor');
            return true;
        } catch (error) {
            console.log('⚠️ SERVER OFFLINE:', error.message);
            this.isOnline = false;
            notificationService.info('Trabajando sin conexión');
            return false;
        }
    }

    /**
     * Inicializa el storage
     * @returns {Promise<boolean>} Siempre true
     */
    async initialize() {
        console.log('✅ API STORAGE INITIALIZED');
        // Verificar conexión al inicializar
        this.checkConnection().catch(console.error);
        return true;
    }

    /**
     * Establece cliente de Supabase (para compatibilidad)
     * @param {Object} supabase - Cliente Supabase
     */
    setSupabaseClient(supabase) {
        console.log('🔐 Supabase client set');
        // El token ya se obtiene de localStorage automáticamente
    }

    /**
     * Establece token de autenticación (para compatibilidad)
     * @param {string} token - Token de autenticación
     */
    setAuthToken(token) {
        console.log('🔐 Auth token set (redundante - ya se obtiene automáticamente)');
    }
}

// Exportar instancia única
export const apiStorage = new ApiStorage();