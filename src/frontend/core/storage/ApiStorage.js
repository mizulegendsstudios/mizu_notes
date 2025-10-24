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
        this.supabase = null; // Necesitamos esta referencia
    }

    setAuthToken(token) {
        this.token = token;
        console.log('🔐 ApiStorage: Token de autenticación configurado');
        if (token) {
            localStorage.setItem('mizu_auth_token', token);
            // Obtener información del usuario cuando tenemos token
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
            if (error) throw error;
            
            if (user) {
                this.currentUserId = user.id;
                localStorage.setItem('mizu_current_user_id', user.id);
                console.log('✅ ApiStorage: Usuario actual establecido:', user.email, 'ID:', user.id);
                return user;
            }
        } catch (error) {
            console.warn('⚠️ ApiStorage: No se pudo obtener información del usuario:', error);
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
        console.log('🌐 ApiStorage: Haciendo request a', url, options);
        
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
                ...options.headers
            };

            const response = await fetch(url, {
                headers,
                ...options
            });

            console.log('📡 ApiStorage: Response status', response.status, 'para', endpoint);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ ApiStorage: Request exitoso a', endpoint, data);
            return data;

        } catch (error) {
            console.error('❌ ApiStorage: Error en request a', endpoint, error);
            throw error;
        }
    }

    async getNotes() {
        try {
            console.log('🔍 ApiStorage.getNotes - Token:', !!this.token, 'User:', this.currentUserId);
            
            if (this.token && this.currentUserId) {
                console.log('🌐 Obteniendo notas del servidor...');
                const result = await this.makeRequest('/notes');
                
                const notesMap = new Map();
                if (result.data && Array.isArray(result.data)) {
                    result.data.forEach(noteData => {
                        const note = new Note(
                            noteData.id,
                            noteData.title,
                            noteData.content,
                            new Date(noteData.created_at || noteData.createdAt),
                            new Date(noteData.updated_at || noteData.updatedAt),
                            noteData.version || 1
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
                
                for (const note of notes) {
                    try {
                        const noteData = {
                            title: note.title,
                            content: note.content,
                            version: note.version
                        };
                        
                        if (note.id && !note.id.startsWith('local_')) {
                            // Nota existente - actualizar
                            console.log('✏️ Actualizando nota existente:', note.id);
                            const result = await this.makeRequest(`/notes/${note.id}`, {
                                method: 'PUT',
                                body: JSON.stringify(noteData)
                            });
                            results.push(result);
                        } else {
                            // Nota nueva - crear
                            console.log('➕ Creando nota nueva:', note.title);
                            const result = await this.makeRequest('/notes', {
                                method: 'POST',
                                body: JSON.stringify(noteData)
                            });
                            results.push(result);
                        }
                    } catch (error) {
                        console.error('❌ Error sincronizando nota:', error);
                    }
                }
                
                console.log('✅ Sincronización completada:', results.length, 'notas procesadas');
                notificationService.success('Notas sincronizadas con el servidor');
                return results;
            } else {
                console.log('📱 Usuario no autenticado, guardando localmente');
                this.saveNotesToLocalStorage(notesMap);
                notificationService.info('Notas guardadas localmente');
                return [];
            }
        } catch (error) {
            console.error('❌ Error guardando notas:', error);
            this.saveNotesToLocalStorage(notesMap);
            notificationService.warning('Notas guardadas localmente (error de sincronización)');
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

    async initialize() {
        const savedToken = localStorage.getItem('mizu_auth_token');
        const savedUserId = localStorage.getItem('mizu_current_user_id');
        
        if (savedToken) {
            this.token = savedToken;
            this.currentUserId = savedUserId;
            console.log('✅ ApiStorage: Usuario recuperado -', savedUserId);
            
            // Si tenemos token pero no userId, obtener información del usuario
            if (this.token && !this.currentUserId && this.supabase) {
                await this.getCurrentUserInfo();
            }
        } else {
            console.log('📱 ApiStorage: No hay usuario autenticado');
        }
        
        console.log('✅ ApiStorage: Inicialización completada');
        return true;
    }

    // Necesitamos una referencia a Supabase para obtener el usuario
    setSupabaseClient(supabase) {
        this.supabase = supabase;
        console.log('✅ ApiStorage: Cliente Supabase configurado');
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