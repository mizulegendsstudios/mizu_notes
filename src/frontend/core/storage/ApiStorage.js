// src/frontend/core/storage/ApiStorage.js - VERSIÓN COMPLETA CORREGIDA

import { Note } from '../../../shared/types/Note.js';
import { loadingService } from '../services/LoadingService.js';
import { notificationService } from '../services/NotificationService.js';

export class ApiStorage {
    constructor(baseURL = 'https://mizu-notes-o96sirmqd-mizulegendsstudios-admins-projects.vercel.app/api') {
        this.baseURL = baseURL;
        this.token = null;
        this.currentUserId = null;
        this.isOnline = false;
        this.pendingRequests = [];
        this.supabase = null;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    setAuthToken(token) {
        this.token = token;
        console.log('🔐 ApiStorage: Token de autenticación configurado', token ? '✓' : '✗');
        if (token) {
            localStorage.setItem('mizu_auth_token', token);
            this.getCurrentUserInfo();
        } else {
            this.clearUserData();
        }
    }

    async getCurrentUserInfo() {
        try {
            console.log('🔍 ApiStorage: Obteniendo información del usuario...');
            
            if (!this.supabase) {
                console.warn('⚠️ ApiStorage: Supabase client no está configurado');
                return null;
            }
            
            const { data: { user }, error } = await this.supabase.auth.getUser();
            if (error) {
                console.error('❌ Error obteniendo usuario de Supabase:', error);
                throw error;
            }
            
            if (user) {
                this.currentUserId = user.id;
                localStorage.setItem('mizu_current_user_id', user.id);
                console.log('✅ ApiStorage: Usuario actual establecido:', user.email, 'ID:', user.id);
                return user;
            } else {
                console.log('👤 ApiStorage: No hay usuario autenticado en Supabase');
                this.clearUserData();
            }
        } catch (error) {
            console.warn('⚠️ ApiStorage: No se pudo obtener información del usuario:', error);
            this.clearUserData();
        }
        return null;
    }

    clearUserData() {
        this.token = null;
        this.currentUserId = null;
        localStorage.removeItem('mizu_auth_token');
        localStorage.removeItem('mizu_current_user_id');
        console.log('🧹 ApiStorage: Datos de usuario limpiados');
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        console.log('🌐 ApiStorage: Haciendo request a', url, 'Método:', options.method || 'GET');
        
        // Mostrar headers pero ocultar token completo por seguridad
        const safeHeaders = { ...options.headers };
        if (safeHeaders.Authorization) {
            safeHeaders.Authorization = 'Bearer ***' + safeHeaders.Authorization.slice(-10);
        }
        console.log('📤 Headers:', safeHeaders);

        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
                ...options.headers
            };

            // 🔧 CONFIGURACIÓN FETCH CORREGIDA
            const fetchOptions = {
                method: options.method || 'GET',
                headers,
                mode: 'cors',
                credentials: 'omit', // ⚡️ CAMBIADO de 'include' a 'omit' para CORS
                ...options
            };

            // Si tiene body, convertirlo a JSON (si no es ya string)
            if (options.body && typeof options.body === 'object') {
                fetchOptions.body = JSON.stringify(options.body);
            } else if (options.body) {
                fetchOptions.body = options.body;
            }

            console.log('🔧 Fetch options:', {
                method: fetchOptions.method,
                mode: fetchOptions.mode,
                credentials: fetchOptions.credentials,
                hasBody: !!fetchOptions.body
            });

            const response = await fetch(url, fetchOptions);

            console.log('📡 ApiStorage: Response status', response.status, response.statusText, 'para', endpoint);

            // Si es 401, limpiar datos de usuario
            if (response.status === 401) {
                console.warn('⚠️ ApiStorage: Token inválido o expirado');
                this.clearUserData();
                notificationService.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
            }

            if (!response.ok) {
                let errorText = 'Error desconocido';
                try {
                    errorText = await response.text();
                } catch (e) {
                    errorText = `HTTP ${response.status} - ${response.statusText}`;
                }
                
                const error = new Error(errorText);
                error.status = response.status;
                error.statusText = response.statusText;
                throw error;
            }

            const data = await response.json();
            console.log('✅ ApiStorage: Request exitoso a', endpoint, data);
            return data;

        } catch (error) {
            console.error('❌ ApiStorage: Error en request a', endpoint, error);
            
            // Manejar errores de CORS específicamente
            if (error.message.includes('CORS') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                const corsError = new Error('No se puede conectar con el servidor. Verifica la configuración CORS y la conexión a internet.');
                corsError.isCorsError = true;
                corsError.originalError = error;
                
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    console.log(`🔄 Reintentando request (${this.retryCount}/${this.maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
                    return this.makeRequest(endpoint, options);
                } else {
                    notificationService.error('Error de conexión con el servidor. Verifica tu conexión a internet.');
                    throw corsError;
                }
            }
            
            // Reiniciar contador de reintentos si no es error de CORS
            this.retryCount = 0;
            
            // Propagamos el error para que el llamador lo maneje
            throw error;
        }
    }

    async getNotes() {
        try {
            console.log('🔍 ApiStorage.getNotes - Token:', !!this.token, 'User:', this.currentUserId);
            
            if (this.token && this.currentUserId) {
                console.log('🌐 Obteniendo notas del servidor...');
                loadingService.show('Cargando notas del servidor...');
                
                const result = await this.makeRequest('/notes');
                
                const notesMap = new Map();
                if (result.data && Array.isArray(result.data)) {
                    result.data.forEach(noteData => {
                        try {
                            const note = new Note(
                                noteData.id,
                                noteData.title,
                                noteData.content,
                                new Date(noteData.created_at || noteData.createdAt),
                                new Date(noteData.updated_at || noteData.updatedAt),
                                noteData.version || 1
                            );
                            notesMap.set(note.id, note);
                        } catch (parseError) {
                            console.error('❌ Error parseando nota:', noteData, parseError);
                        }
                    });
                }
                
                console.log('✅ Notas del servidor mapeadas:', notesMap.size);
                this.saveNotesToLocalStorage(notesMap);
                loadingService.hide();
                return notesMap;
            } else {
                console.log('📱 Usando notas locales (no autenticado)');
                return this.getLocalNotes();
            }
        } catch (error) {
            console.error('❌ Error obteniendo notas del servidor:', error);
            loadingService.hide();
            
            if (error.isCorsError) {
                notificationService.warning('Usando notas locales (sin conexión al servidor)');
            }
            
            return this.getLocalNotes();
        }
    }

    getLocalNotes() {
        try {
            const userNotesKey = this.currentUserId ? `mizu_notes_${this.currentUserId}` : 'mizu_notes';
            const notesData = localStorage.getItem(userNotesKey);
            
            const notesMap = new Map();
            if (notesData) {
                const parsed = JSON.parse(notesData);
                if (Array.isArray(parsed)) {
                    parsed.forEach(noteData => {
                        try {
                            const note = new Note(
                                noteData.id,
                                noteData.title,
                                noteData.content,
                                new Date(noteData.createdAt),
                                new Date(noteData.updatedAt),
                                noteData.version || 1
                            );
                            notesMap.set(note.id, note);
                        } catch (parseError) {
                            console.error('❌ Error parseando nota local:', noteData, parseError);
                        }
                    });
                }
            }
            console.log('📁 Notas locales cargadas:', notesMap.size);
            return notesMap;
        } catch (error) {
            console.error('❌ Error obteniendo notas locales:', error);
            return new Map();
        }
    }

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
            
            const userNotesKey = this.currentUserId ? `mizu_notes_${this.currentUserId}` : 'mizu_notes';
            localStorage.setItem(userNotesKey, JSON.stringify(notesArray));
            console.log('💾 Notas guardadas en localStorage:', notesArray.length);
            
        } catch (error) {
            console.error('❌ Error guardando notas en localStorage:', error);
        }
    }

    async saveNotes(notesMap) {
        try {
            console.log('💾 ApiStorage.saveNotes - Total notas:', notesMap.size);
            
            if (this.token && this.currentUserId) {
                const notes = Array.from(notesMap.values());
                const results = [];
                
                console.log('🔄 Sincronizando', notes.length, 'notas con el servidor...');
                loadingService.show('Sincronizando notas...');
                
                for (const note of notes) {
                    try {
                        const noteData = {
                            title: note.title,
                            content: note.content,
                            version: note.version
                        };
                        
                        if (note.id && !note.id.startsWith('local_')) {
                            // Nota existente - actualizar
                            console.log(`📝 Actualizando nota: ${note.id}`);
                            const result = await this.makeRequest(`/notes/${note.id}`, {
                                method: 'PUT',
                                body: noteData
                            });
                            results.push(result);
                        } else {
                            // Nota nueva - crear
                            console.log(`🆕 Creando nueva nota: ${note.title}`);
                            const result = await this.makeRequest('/notes', {
                                method: 'POST',
                                body: noteData
                            });
                            
                            if (result.data && result.data.id) {
                                // Actualizar el ID local con el ID del servidor
                                note.id = result.data.id;
                                results.push(result);
                            }
                        }
                    } catch (error) {
                        console.error(`❌ Error sincronizando nota "${note.title}":`, error);
                        // Continuar con las siguientes notas
                    }
                }
                
                console.log('✅ Sincronización completada:', results.length, 'notas procesadas');
                loadingService.hide();
                
                // Guardar las notas actualizadas (con IDs del servidor) en localStorage
                this.saveNotesToLocalStorage(notesMap);
                
                if (results.length === notes.length) {
                    notificationService.success('Todas las notas sincronizadas correctamente');
                } else {
                    notificationService.warning(`Sincronizadas ${results.length} de ${notes.length} notas`);
                }
                
                return results;
            } else {
                console.log('📱 Usuario no autenticado, guardando localmente');
                this.saveNotesToLocalStorage(notesMap);
                notificationService.info('Notas guardadas localmente');
                return [];
            }
        } catch (error) {
            console.error('❌ Error guardando notas:', error);
            loadingService.hide();
            
            // En caso de error, siempre guardar localmente
            this.saveNotesToLocalStorage(notesMap);
            
            if (error.isCorsError) {
                notificationService.warning('Notas guardadas localmente (sin conexión al servidor)');
            } else {
                notificationService.warning('Notas guardadas localmente (error de sincronización)');
            }
            
            throw error;
        }
    }

    async createNote(noteData) {
        try {
            if (this.token && this.currentUserId) {
                console.log('🆕 Creando nueva nota en servidor:', noteData.title);
                const result = await this.makeRequest('/notes', {
                    method: 'POST',
                    body: noteData
                });
                return result.data;
            } else {
                // Crear nota local con ID temporal
                const localNote = {
                    ...noteData,
                    id: 'local_' + Date.now(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    version: 1
                };
                console.log('📝 Creando nota local:', localNote.title);
                return localNote;
            }
        } catch (error) {
            console.error('❌ Error creando nota:', error);
            throw error;
        }
    }

    async updateNote(noteId, noteData) {
        try {
            if (this.token && this.currentUserId && !noteId.startsWith('local_')) {
                console.log('📝 Actualizando nota en servidor:', noteId);
                const result = await this.makeRequest(`/notes/${noteId}`, {
                    method: 'PUT',
                    body: noteData
                });
                return result.data;
            } else {
                // Actualizar nota local
                console.log('📝 Actualizando nota local:', noteId);
                return { ...noteData, id: noteId, updatedAt: new Date() };
            }
        } catch (error) {
            console.error('❌ Error actualizando nota:', error);
            throw error;
        }
    }

    async deleteNote(noteId) {
        try {
            if (this.token && this.currentUserId && !noteId.startsWith('local_')) {
                console.log('🗑️ Eliminando nota del servidor:', noteId);
                const result = await this.makeRequest(`/notes/${noteId}`, {
                    method: 'DELETE'
                });
                return result;
            } else {
                // Eliminar nota local
                console.log('🗑️ Eliminando nota local:', noteId);
                return { success: true, message: 'Nota local eliminada' };
            }
        } catch (error) {
            console.error('❌ Error eliminando nota:', error);
            throw error;
        }
    }

    async initialize() {
        try {
            const savedToken = localStorage.getItem('mizu_auth_token');
            const savedUserId = localStorage.getItem('mizu_current_user_id');
            
            if (savedToken) {
                this.token = savedToken;
                this.currentUserId = savedUserId;
                console.log('✅ ApiStorage: Usuario recuperado -', savedUserId);
                
                // Si tenemos token pero no user ID, intentar obtenerlo
                if (this.token && !this.currentUserId && this.supabase) {
                    await this.getCurrentUserInfo();
                }
            } else {
                console.log('📱 ApiStorage: No hay usuario autenticado');
            }
            
            // Verificar conexión con el servidor
            await this.checkConnection();
            
            console.log('✅ ApiStorage: Inicialización completada');
            return true;
        } catch (error) {
            console.error('❌ Error inicializando ApiStorage:', error);
            return false;
        }
    }

    setSupabaseClient(supabase) {
        this.supabase = supabase;
        console.log('✅ ApiStorage: Cliente Supabase configurado');
        
        // Si ya tenemos token, obtener información del usuario
        if (this.token) {
            this.getCurrentUserInfo();
        }
    }

    async checkConnection() {
        try {
            console.log('🔌 Verificando conexión con el servidor...');
            const result = await this.makeRequest('/health');
            this.isOnline = true;
            this.retryCount = 0; // Reiniciar contador en conexión exitosa
            console.log('✅ Conexión con servidor: OK');
            return true;
        } catch (error) {
            this.isOnline = false;
            console.warn('⚠️ Sin conexión con el servidor:', error.message);
            return false;
        }
    }

    // Método para forzar sincronización cuando se recupera la conexión
    async syncPendingChanges(notesManager) {
        if (this.isOnline && this.token) {
            console.log('🔄 Sincronizando cambios pendientes...');
            try {
                const notesMap = notesManager.getNotesMap();
                await this.saveNotes(notesMap);
                return true;
            } catch (error) {
                console.error('❌ Error sincronizando cambios pendientes:', error);
                return false;
            }
        }
        return false;
    }

    // Método para limpiar datos específicos de usuario
    clearUserNotes() {
        if (this.currentUserId) {
            const userNotesKey = `mizu_notes_${this.currentUserId}`;
            localStorage.removeItem(userNotesKey);
            console.log('🧹 Notas de usuario eliminadas:', userNotesKey);
        }
        localStorage.removeItem('mizu_notes');
        console.log('🧹 Notas locales eliminadas');
    }
}

// Exportar instancia singleton
export const apiStorage = new ApiStorage();