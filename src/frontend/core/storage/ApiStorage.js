// src/frontend/core/storage/ApiStorage.js - VERSIÓN CON GESTIÓN DE USUARIOS
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
        console.log('ApiStorage: Token de autenticación configurado');
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
            const profile = await this.getProfile();
            if (profile) {
                this.currentUserId = profile.id;
                localStorage.setItem('mizu_current_user_id', profile.id);
                console.log('ApiStorage: Usuario actual establecido:', profile.email);
            }
        } catch (error) {
            console.warn('No se pudo obtener información del usuario:', error);
        }
    }

    clearUserData() {
        this.token = null;
        this.currentUserId = null;
        localStorage.removeItem('mizu_auth_token');
        localStorage.removeItem('mizu_current_user_id');
        
        // Limpiar notas locales al cerrar sesión
        this.clearLocalNotes();
        
        console.log('ApiStorage: Datos de usuario limpiados');
    }

    clearLocalNotes() {
        // Limpiar solo las notas del usuario actual del localStorage
        const userNotesKey = `mizu_notes_${this.currentUserId}`;
        localStorage.removeItem(userNotesKey);
        
        // También limpiar notas globales (para compatibilidad)
        localStorage.removeItem('mizu_notes');
        
        console.log('ApiStorage: Notas locales limpiadas');
    }

    async makeRequest(endpoint, options = {}) {
        const operation = `api_${endpoint.replace(/\//g, '_')}`;
        
        try {
            loadingService.startLoading(operation);
            
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { error: errorText || 'Error desconocido' };
                }
                
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            loadingService.completeLoading(operation);
            
            return data;
        } catch (error) {
            loadingService.errorLoading(operation, error);
            
            if (!error.message.includes('Token') && !error.message.includes('401')) {
                notificationService.error(`Error en API: ${error.message}`);
            }
            
            throw error;
        }
    }

    async getNotes() {
        try {
            // Si hay usuario autenticado, obtener notas del backend
            if (this.token && this.currentUserId) {
                const result = await this.makeRequest('/notes');
                
                // Convertir array de objetos a Map de instancias Note
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
                
                // Guardar en localStorage como respaldo
                this.saveNotesToLocalStorage(notesMap);
                
                return notesMap;
            } else {
                // Usuario no autenticado - usar notas locales
                return this.getLocalNotes();
            }
        } catch (error) {
            console.error('Error obteniendo notas del servidor, usando locales:', error);
            // Fallback a notas locales si el servidor falla
            return this.getLocalNotes();
        }
    }

    getLocalNotes() {
        try {
            // Intentar obtener notas específicas del usuario
            const userNotesKey = `mizu_notes_${this.currentUserId}`;
            let notesData = localStorage.getItem(userNotesKey);
            
            // Fallback a notas globales si no hay específicas del usuario
            if (!notesData) {
                notesData = localStorage.getItem('mizu_notes');
            }
            
            const notesMap = new Map();
            if (notesData) {
                const parsed = JSON.parse(notesData);
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
            
            return notesMap;
        } catch (error) {
            console.error('Error obteniendo notas locales:', error);
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
            
            // Guardar en localStorage específico del usuario
            if (this.currentUserId) {
                const userNotesKey = `mizu_notes_${this.currentUserId}`;
                localStorage.setItem(userNotesKey, JSON.stringify(notesArray));
            }
            
            // También guardar en localStorage global (para compatibilidad)
            localStorage.setItem('mizu_notes', JSON.stringify(notesArray));
            
        } catch (error) {
            console.error('Error guardando notas en localStorage:', error);
        }
    }

    async saveNotes(notesMap) {
        try {
            // Si hay usuario autenticado, sincronizar con el servidor
            if (this.token && this.currentUserId) {
                const notes = Array.from(notesMap.values());
                const results = [];
                
                for (const note of notes) {
                    if (note.id && note.id.startsWith('local_')) {
                        // Es una nota nueva local - usar POST
                        const result = await this.createNote({
                            title: note.title,
                            content: note.content,
                            version: note.version
                        });
                        results.push(result);
                    } else {
                        // Nota existente - usar PUT
                        const result = await this.updateNote(note.id, {
                            title: note.title,
                            content: note.content,
                            version: note.version
                        });
                        results.push(result);
                    }
                }
                
                notificationService.success('Notas sincronizadas correctamente');
                return results;
            } else {
                // Usuario no autenticado - solo guardar localmente
                this.saveNotesToLocalStorage(notesMap);
                notificationService.info('Notas guardadas localmente');
                return [];
            }
        } catch (error) {
            console.error('Error guardando notas:', error);
            // Fallback a guardado local
            this.saveNotesToLocalStorage(notesMap);
            notificationService.warning('Notas guardadas localmente (sin sincronización)');
            throw error;
        }
    }

    async createNote(noteData) {
        try {
            const result = await this.makeRequest('/notes', {
                method: 'POST',
                body: JSON.stringify(noteData)
            });
            
            notificationService.success('Nota creada correctamente');
            return result.data;
        } catch (error) {
            console.error('Error creando nota:', error);
            throw error;
        }
    }

    async updateNote(noteId, updates) {
        try {
            const result = await this.makeRequest(`/notes/${noteId}`, {
                method: 'PUT',
                body: JSON.stringify(updates)
            });
            
            notificationService.success('Nota actualizada');
            return result.data;
        } catch (error) {
            console.error('Error actualizando nota:', error);
            throw error;
        }
    }

    async deleteNote(noteId) {
        try {
            const result = await this.makeRequest(`/notes/${noteId}`, {
                method: 'DELETE'
            });
            
            notificationService.success('Nota eliminada');
            return result;
        } catch (error) {
            console.error('Error eliminando nota:', error);
            throw error;
        }
    }

    // Métodos de autenticación mejorados
    async login(email, password) {
        try {
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
            console.error('Error en login:', error);
            notificationService.error('Error en inicio de sesión');
            throw error;
        }
    }

    async syncAfterLogin() {
        try {
            notificationService.info('Sincronizando notas...');
            // Forzar recarga de notas desde el servidor
            const notesManager = window.app?.notesManager;
            if (notesManager) {
                await notesManager.loadNotes();
            }
        } catch (error) {
            console.error('Error en sincronización post-login:', error);
        }
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
            console.error('Error en registro:', error);
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
            console.error('Error en logout:', error);
            this.clearUserData();
            notificationService.info('Sesión cerrada (sin conexión al servidor)');
            throw error;
        }
    }

    async getProfile() {
        try {
            const result = await this.makeRequest('/auth/profile');
            return result.data;
        } catch (error) {
            console.error('Error obteniendo perfil:', error);
            throw error;
        }
    }

    async initialize() {
        const savedToken = localStorage.getItem('mizu_auth_token');
        const savedUserId = localStorage.getItem('mizu_current_user_id');
        
        if (savedToken) {
            this.token = savedToken;
            this.currentUserId = savedUserId;
            console.log('ApiStorage: Usuario recuperado -', savedUserId);
        }
        
        console.log('ApiStorage: Inicialización completada');
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