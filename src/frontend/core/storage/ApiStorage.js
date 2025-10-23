// src/frontend/core/storage/ApiStorage.js - VERSIÓN PRODUCCIÓN
import { Note } from '../../../shared/types/Note.js';
import { loadingService } from '../services/LoadingService.js';
import { notificationService } from '../services/NotificationService.js';

export class ApiStorage {
    constructor(baseURL = 'https://mizu-notes-o96sirmqd-mizulegendsstudios-admins-projects.vercel.app/api') {
        this.baseURL = baseURL;
        this.token = null;
        this.isOnline = false;
        this.pendingRequests = [];
    }

    setAuthToken(token) {
        this.token = token;
        console.log('ApiStorage: Token de autenticación configurado');
        if (token) {
            localStorage.setItem('mizu_auth_token', token);
        } else {
            localStorage.removeItem('mizu_auth_token');
        }
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
            
            return notesMap;
        } catch (error) {
            console.error('Error obteniendo notas:', error);
            throw error;
        }
    }

    async saveNotes(notesMap) {
        try {
            // En lugar de usar /notes/sync, guardamos cada nota individualmente
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
        } catch (error) {
            console.error('Error guardando notas:', error);
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

    // Métodos de autenticación (sin cambios)
    async login(email, password) {
        try {
            const result = await this.makeRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            
            if (result.data?.session?.access_token) {
                this.setAuthToken(result.data.session.access_token);
            }
            
            notificationService.success('Inicio de sesión exitoso');
            return result;
        } catch (error) {
            console.error('Error en login:', error);
            notificationService.error('Error en inicio de sesión');
            throw error;
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
            
            this.token = null;
            localStorage.removeItem('mizu_auth_token');
            notificationService.info('Sesión cerrada correctamente');
        } catch (error) {
            console.error('Error en logout:', error);
            this.token = null;
            localStorage.removeItem('mizu_auth_token');
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
        if (savedToken) {
            this.token = savedToken;
            console.log('ApiStorage: Token recuperado de localStorage');
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