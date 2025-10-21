// src/frontend/core/storage/ApiStorage.js
import { Note } from '../../../shared/types/Note.js';
import { loadingService } from '../services/LoadingService.js';
import { notificationService } from '../services/NotificationService.js';

export class ApiStorage {
    constructor(baseURL = 'http://localhost:3000/api') {
        this.baseURL = baseURL;
        this.token = null;
        this.isOnline = false;
        this.pendingRequests = [];
    }

    setAuthToken(token) {
        this.token = token;
        console.log('ApiStorage: Token de autenticación configurado');
    }

    async makeRequest(endpoint, options = {}) {
        const operation = \pi_\\;
        
        try {
            loadingService.startGlobalLoading(operation);
            
            const response = await fetch(\\\\, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.token && { 'Authorization': \Bearer \\ }),
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
                
                throw new Error(errorData.error || \HTTP \: \\);
            }

            const data = await response.json();
            loadingService.completeLoading(operation);
            
            return data;
        } catch (error) {
            loadingService.errorLoading(operation, error);
            
            // Mostrar notificación solo para errores que no sean de autenticación
            if (!error.message.includes('Token') && !error.message.includes('401')) {
                notificationService.operationError('API Request', error);
            }
            
            throw error;
        }
    }

    async getNotes() {
        try {
            const result = await this.makeRequest('/notes');
            return result.data || [];
        } catch (error) {
            console.error('Error obteniendo notas:', error);
            throw error;
        }
    }

    async saveNotes(notesMap) {
        try {
            const notes = Array.from(notesMap.values()).map(note => note.toJSON());
            const result = await this.makeRequest('/notes/sync', {
                method: 'POST',
                body: JSON.stringify({ 
                    notes,
                    lastSync: Date.now()
                })
            });
            
            notificationService.operationSuccess('Sincronización');
            return result;
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
            const result = await this.makeRequest(\/notes/\\, {
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
            const result = await this.makeRequest(\/notes/\\, {
                method: 'DELETE'
            });
            
            notificationService.success('Nota eliminada');
            return result;
        } catch (error) {
            console.error('Error eliminando nota:', error);
            throw error;
        }
    }

    // Métodos de autenticación
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
            throw error;
        }
    }

    async logout() {
        try {
            await this.makeRequest('/auth/logout', {
                method: 'POST'
            });
            
            this.token = null;
            notificationService.info('Sesión cerrada');
        } catch (error) {
            console.error('Error en logout:', error);
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
        console.log('ApiStorage: Inicialización completada');
        return true;
    }
}
