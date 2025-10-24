// src/frontend/core/storage/ApiStorage.js - VERSIÓN MEJORADA CON DEBUG
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
    }

    setAuthToken(token) {
        this.token = token;
        console.log('🔐 ApiStorage: Token de autenticación configurado');
        if (token) {
            localStorage.setItem('mizu_auth_token', token);
            // Intentar obtener el usuario actual cuando se establece el token
            this.getCurrentUserInfo();
        } else {
            this.clearUserData();
        }
    }

    async getCurrentUserInfo() {
        try {
            console.log('🔍 ApiStorage: Obteniendo información del usuario...');
            const profile = await this.getProfile();
            if (profile) {
                this.currentUserId = profile.id;
                localStorage.setItem('mizu_current_user_id', profile.id);
                console.log('✅ ApiStorage: Usuario actual establecido:', profile.email, 'ID:', profile.id);
            } else {
                console.warn('⚠️ ApiStorage: No se pudo obtener perfil del usuario');
            }
        } catch (error) {
            console.warn('⚠️ ApiStorage: No se pudo obtener información del usuario:', error);
        }
    }

    clearUserData() {
        this.token = null;
        this.currentUserId = null;
        localStorage.removeItem('mizu_auth_token');
        localStorage.removeItem('mizu_current_user_id');
        
        // Limpiar notas locales al cerrar sesión
        this.clearLocalNotes();
        
        console.log('🧹 ApiStorage: Datos de usuario limpiados');
    }

    clearLocalNotes() {
        // Limpiar solo las notas del usuario actual del localStorage
        if (this.currentUserId) {
            const userNotesKey = `mizu_notes_${this.currentUserId}`;
            localStorage.removeItem(userNotesKey);
        }
        
        // También limpiar notas globales (para compatibilidad)
        localStorage.removeItem('mizu_notes');
        
        console.log('🧹 ApiStorage: Notas locales limpiadas');
    }

    async makeRequest(endpoint, options = {}) {
        const operation = `api_${endpoint.replace(/\//g, '_')}`;
        
        try {
            loadingService.startLoading(operation);
            
            console.log(`🌐 ApiStorage: Haciendo request a ${endpoint}`, options);
            
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
                    ...options.headers
                },
                ...options
            });

            console.log(`📡 ApiStorage: Response status ${response.status} para ${endpoint}`);

            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { error: errorText || 'Error desconocido' };
                }
                
                console.error(`❌ ApiStorage: Error en ${endpoint}:`, errorData);
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`✅ ApiStorage: Request exitoso a ${endpoint}:`, data);
            loadingService.completeLoading(operation);
            
            return data;
        } catch (error) {
            console.error(`❌ ApiStorage: Error en request a ${endpoint}:`, error);
            loadingService.errorLoading(operation, error);
            
            if (!error.message.includes('Token') && !error.message.includes('401')) {
                notificationService.error(`Error en API: ${error.message}`);
            }
            
            throw error;
        }
    }

    async getNotes() {
        try {
            console.log('🔍 ApiStorage.getNotes - Token:', !!this.token, 'User:', this.currentUserId);
            
            if (this.token && this.currentUserId) {
                console.log('🌐 Obteniendo notas del servidor...');
                const result = await this.makeRequest('/notes');
                console.log('📦 Respuesta del servidor:', result);
                
                const notesMap = new Map();
                if (result.data && Array.isArray(result.data)) {
                    result.data.forEach(noteData => {
                        const note = new Note(
                            noteData.id,
                            noteData.title,
                            noteData.content,
                            noteData.createdAt || noteData.created_at,
                            noteData.updatedAt || noteData.updated_at,
                            noteData.version
                        );
                        notesMap.set(note.id, note);
                    });
                }
                
                console.log('✅ Notas del servidor mapeadas:', notesMap.size);
                this.saveNotesToLocalStorage(notesMap);
                return notesMap;
            } else {
                console.log('📱 Usando notas locales (no autenticado)');
                return this.getLocalNotes();
            }
        } catch (error) {
            console.error('❌ Error obteniendo notas del servidor:', error);
            console.log('📱 Fallback a notas locales');
            return this.getLocalNotes();
        }
    }

    getLocalNotes() {
        try {
            console.log('🔍 ApiStorage: Buscando notas locales...');
            
            // Intentar obtener notas específicas del usuario
            const userNotesKey = `mizu_notes_${this.currentUserId}`;
            let notesData = localStorage.getItem(userNotesKey);
            
            console.log('📁 Clave de notas del usuario:', userNotesKey, '¿Existe?', !!notesData);
            
            // Fallback a notas globales si no hay específicas del usuario
            if (!notesData) {
                notesData = localStorage.getItem('mizu_notes');
                console.log('📁 Usando notas globales, ¿existen?', !!notesData);
            }
            
            const notesMap = new Map();
            if (notesData) {
                const parsed = JSON.parse(notesData);
                console.log('📝 Notas locales parseadas:', parsed.length);
                
                if (Array.isArray(parsed)) {
                    parsed.forEach(noteData => {
                        const note = new Note(
                            noteData.id,
                            noteData.title,
                            noteData.content,
                            noteData.createdAt,
                            noteData.updatedAt,
                            noteData.version
                        );
                        notesMap.set(note.id, note);
                    });
                }
            }
            
            console.log('✅ Notas locales cargadas:', notesMap.size);
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
            
            console.log('💾 Guardando notas en localStorage:', notesArray.length);
            
            // Guardar en localStorage específico del usuario
            if (this.currentUserId) {
                const userNotesKey = `mizu_notes_${this.currentUserId}`;
                localStorage.setItem(userNotesKey, JSON.stringify(notesArray));
                console.log('✅ Notas guardadas en:', userNotesKey);
            }
            
            // También guardar en localStorage global (para compatibilidad)
            localStorage.setItem('mizu_notes', JSON.stringify(notesArray));
            console.log('✅ Notas guardadas en localStorage global');
            
        } catch (error) {
            console.error('❌ Error guardando notas en localStorage:', error);
        }
    }

    async saveNotes(notesMap) {
        try {
            console.log('💾 ApiStorage.saveNotes - Total notas:', notesMap.size);
            
            // Si hay usuario autenticado, sincronizar con el servidor
            if (this.token && this.currentUserId) {
                const notes = Array.from(notesMap.values());
                const results = [];
                
                console.log('🔄 Sincronizando', notes.length, 'notas con el servidor...');
                
                for (const note of notes) {
                    try {
                        if (note.id && note.id.startsWith('local_')) {
                            // Es una nota nueva local - usar POST
                            console.log('➕ Creando nota nueva:', note.title);
                            const result = await this.createNote({
                                title: note.title,
                                content: note.content,
                                version: note.version
                            });
                            results.push(result);
                        } else {
                            // Nota existente - usar PUT
                            console.log('✏️ Actualizando nota existente:', note.id, note.title);
                            const result = await this.updateNote(note.id, {
                                title: note.title,
                                content: note.content,
                                version: note.version
                            });
                            results.push(result);
                        }
                    } catch (error) {
                        console.error(`❌ Error sincronizando nota ${note.id}:`, error);
                        // Continuar con las demás notas
                    }
                }
                
                console.log('✅ Sincronización completada:', results.length, 'notas procesadas');
                notificationService.success('Notas sincronizadas correctamente');
                return results;
            } else {
                // Usuario no autenticado - solo guardar localmente
                console.log('📱 Usuario no autenticado, guardando localmente');
                this.saveNotesToLocalStorage(notesMap);
                notificationService.info('Notas guardadas localmente');
                return [];
            }
        } catch (error) {
            console.error('❌ Error guardando notas:', error);
            // Fallback a guardado local
            this.saveNotesToLocalStorage(notesMap);
            notificationService.warning('Notas guardadas localmente (sin sincronización)');
            throw error;
        }
    }

    async createNote(noteData) {
        try {
            console.log('📝 ApiStorage.createNote:', noteData);
            const result = await this.makeRequest('/notes', {
                method: 'POST',
                body: JSON.stringify(noteData)
            });
            
            console.log('✅ Nota creada en servidor:', result.data);
            notificationService.success('Nota creada correctamente');
            return result.data;
        } catch (error) {
            console.error('❌ Error creando nota:', error);
            throw error;
        }
    }

    async updateNote(noteId, updates) {
        try {
            console.log('✏️ ApiStorage.updateNote:', noteId, updates);
            const result = await this.makeRequest(`/notes/${noteId}`, {
                method: 'PUT',
                body: JSON.stringify(updates)
            });
            
            console.log('✅ Nota actualizada en servidor:', result.data);
            notificationService.success('Nota actualizada');
            return result.data;
        } catch (error) {
            console.error('❌ Error actualizando nota:', error);
            throw error;
        }
    }

    async deleteNote(noteId) {
        try {
            console.log('🗑️ ApiStorage.deleteNote:', noteId);
            const result = await this.makeRequest(`/notes/${noteId}`, {
                method: 'DELETE'
            });
            
            console.log('✅ Nota eliminada del servidor');
            notificationService.success('Nota eliminada');
            return result;
        } catch (error) {
            console.error('❌ Error eliminando nota:', error);
            throw error;
        }
    }

    // Métodos de autenticación mejorados
    async login(email, password) {
        try {
            console.log('🔐 ApiStorage.login para:', email);
            const result = await this.makeRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            
            if (result.data?.session?.access_token) {
                this.setAuthToken(result.data.session.access_token);
                // Sincronizar notas después del login
                await this.syncAfterLogin();
            }
            
            notificationService.success('Inicio de sesión exitoso');
            return result;
        } catch (error) {
            console.error('❌ Error en login:', error);
            notificationService.error('Error en inicio de sesión');
            throw error;
        }
    }

    async syncAfterLogin() {
        try {
            notificationService.info('Sincronizando notas...');
            
            // 1. Obtener notas del servidor
            const serverNotes = await this.getNotes();
            
            // 2. Obtener notas locales (si existen)
            const localNotes = this.getLocalNotes();
            
            // 3. Resolver conflictos y fusionar
            const mergedNotes = this.mergeNotes(serverNotes, localNotes);
            
            // 4. Actualizar el notesManager
            const notesManager = window.app?.notesManager;
            if (notesManager) {
                // Limpiar notas actuales y cargar las fusionadas
                notesManager.clearNotes();
                mergedNotes.forEach(note => {
                    notesManager.notes.set(note.id, note);
                });
                
                // Establecer última nota editada como actual
                if (mergedNotes.size > 0) {
                    const lastEdited = Array.from(mergedNotes.values())
                        .sort((a, b) => b.updatedAt - a.updatedAt)[0];
                    notesManager.setCurrentNote(lastEdited.id);
                }
                
                // Forzar actualización de UI
                notesManager.notifyUpdate();
            }
            
            notificationService.success('Sincronización completada');
            
        } catch (error) {
            console.error('❌ Error en sincronización post-login:', error);
            notificationService.warning('Sincronización parcial - usando notas locales');
        }
    }

    // NUEVO: Fusión inteligente de notas
    mergeNotes(serverNotes, localNotes) {
        const merged = new Map();
        
        console.log('🔄 Iniciando fusión de notas...');
        console.log('📡 Notas del servidor:', serverNotes.size);
        console.log('💾 Notas locales:', localNotes.size);
        
        // Priorizar notas del servidor
        serverNotes.forEach((note, id) => {
            merged.set(id, note);
        });
        
        // Agregar notas locales que no existen en el servidor
        localNotes.forEach((localNote, localId) => {
            if (!merged.has(localId)) {
                // Es una nota local nueva
                console.log('➕ Agregando nota local nueva:', localId);
                merged.set(localId, localNote);
            } else {
                // Resolver conflicto: usar la versión más reciente
                const serverNote = merged.get(localId);
                if (localNote.updatedAt > serverNote.updatedAt) {
                    console.log('🔄 Reemplazando nota del servidor con versión local más reciente:', localId);
                    merged.set(localId, localNote);
                } else {
                    console.log('📡 Manteniendo versión del servidor (más reciente):', localId);
                }
            }
        });
        
        console.log(`✅ Fusión completada: ${merged.size} notas`);
        return merged;
    }

    async register(userData) {
        try {
            const result = await this.makeRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            
            notificationService.success('Usuario registrado correctamente');
            return result;
        } catch (error) {
            console.error('❌ Error en registro:', error);
            notificationService.error('Error en registro');
            throw error;
        }
    }

    async logout() {
        try {
            await this.makeRequest('/auth/logout', {
                method: 'POST'
            });
            
            this.clearUserData();
            notificationService.info('Sesión cerrada correctamente');
            
            // Recargar la aplicación para limpiar estado
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } catch (error) {
            console.error('❌ Error en logout:', error);
            this.clearUserData();
            notificationService.info('Sesión cerrada (sin conexión al servidor)');
            throw error;
        }
    }

    async getProfile() {
        try {
            console.log('👤 ApiStorage: Obteniendo perfil...');
            const result = await this.makeRequest('/auth/profile');
            console.log('✅ Perfil obtenido:', result.data);
            return result.data;
        } catch (error) {
            console.error('❌ Error obteniendo perfil:', error);
            throw error;
        }
    }

    async initialize() {
        const savedToken = localStorage.getItem('mizu_auth_token');
        const savedUserId = localStorage.getItem('mizu_current_user_id');
        
        if (savedToken) {
            this.token = savedToken;
            this.currentUserId = savedUserId;
            console.log('✅ ApiStorage: Usuario recuperado -', savedUserId);
            
            // Obtener información actualizada del usuario
            await this.getCurrentUserInfo();
        } else {
            console.log('📱 ApiStorage: No hay usuario autenticado');
        }
        
        console.log('✅ ApiStorage: Inicialización completada');
        return true;
    }

    async checkConnection() {
        try {
            await this.makeRequest('/health');
            this.isOnline = true;
            return true;
        } catch (error) {
            this.isOnline = false;
            return false;
        }
    }
}