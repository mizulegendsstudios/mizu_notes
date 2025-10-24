// src/frontend/core/storage/ApiStorage.js - VERSIÓN MEJORADA
import { Note } from '../../../shared/types/Note.js';
import { notificationService } from '../services/NotificationService.js';

export class ApiStorage {
    constructor(baseURL = 'https://mizu-notes-git-gh-pages-mizulegendsstudios-admins-projects.vercel.app/api') {
        this.baseURL = baseURL;
        this.token = null;
        this.currentUserId = null;
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        console.log('🌐 ApiStorage: Haciendo request a', url);
        
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
                ...options.headers
            };

            const fetchOptions = {
                method: options.method || 'GET',
                headers,
                mode: 'cors',
                credentials: 'omit'
            };

            if (options.body && typeof options.body === 'object') {
                fetchOptions.body = JSON.stringify(options.body);
            }

            console.log('🔧 Fetch config:', {
                method: fetchOptions.method,
                endpoint: endpoint,
                hasAuth: !!this.token
            });

            const response = await fetch(url, fetchOptions);
            console.log('📡 Response status:', response.status, response.statusText);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Request exitoso:', data);
            return data;

        } catch (error) {
            console.error('❌ Error en request:', error);
            throw error;
        }
    }

    async getNotes() {
        try {
            console.log('🔍 ApiStorage.getNotes - Iniciando...');
            
            const result = await this.makeRequest('/notes');
            
            const notesMap = new Map();
            if (result.data && Array.isArray(result.data)) {
                result.data.forEach(noteData => {
                    try {
                        const note = new Note(
                            noteData.id,
                            noteData.title,
                            noteData.content,
                            new Date(noteData.created_at),
                            new Date(noteData.updated_at),
                            noteData.version || 1
                        );
                        notesMap.set(note.id, note);
                        console.log('📄 Nota cargada:', note.title);
                    } catch (error) {
                        console.error('❌ Error parseando nota:', error);
                    }
                });
            }
            
            console.log('✅ Notas cargadas del servidor:', notesMap.size);
            this.saveNotesToLocalStorage(notesMap);
            return notesMap;
            
        } catch (error) {
            console.error('❌ Error obteniendo notas del servidor:', error);
            console.log('📱 Usando notas locales...');
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
            console.error('❌ Error guardando en localStorage:', error);
        }
    }

    async saveNotes(notesMap) {
        try {
            console.log('💾 ApiStorage.saveNotes - Guardando', notesMap.size, 'notas...');
            
            const notes = Array.from(notesMap.values());
            const results = [];
            
            for (const note of notes) {
                try {
                    const noteData = {
                        title: note.title,
                        content: note.content,
                        version: note.version
                    };
                    
                    if (note.id && note.id.startsWith('note-')) {
                        // Actualizar nota existente
                        console.log('📝 Actualizando nota:', note.id);
                        const result = await this.makeRequest(`/notes/${note.id}`, {
                            method: 'PUT',
                            body: noteData
                        });
                        results.push(result);
                    } else {
                        // Crear nueva nota
                        console.log('🆕 Creando nota:', note.title);
                        const result = await this.makeRequest('/notes', {
                            method: 'POST',
                            body: noteData
                        });
                        
                        if (result.data && result.data.id) {
                            note.id = result.data.id;
                            results.push(result);
                        }
                    }
                } catch (error) {
                    console.error(`❌ Error con nota "${note.title}":`, error);
                }
            }
            
            console.log('✅ Sincronización completada:', results.length, 'notas procesadas');
            
            // Siempre guardar localmente
            this.saveNotesToLocalStorage(notesMap);
            
            if (results.length > 0) {
                notificationService.success('Notas sincronizadas con el servidor');
            } else {
                notificationService.info('Notas guardadas localmente');
            }
            
            return results;
            
        } catch (error) {
            console.error('❌ Error en saveNotes:', error);
            this.saveNotesToLocalStorage(notesMap);
            notificationService.warning('Notas guardadas localmente');
            throw error;
        }
    }

    async initialize() {
        console.log('✅ ApiStorage inicializado');
        return true;
    }

    async checkConnection() {
        try {
            console.log('🔌 Verificando conexión con el servidor...');
            const result = await this.makeRequest('/health');
            console.log('✅ Servidor conectado:', result.status);
            return true;
        } catch (error) {
            console.warn('⚠️ Sin conexión con el servidor:', error.message);
            return false;
        }
    }

    setSupabaseClient(supabase) {
        this.supabase = supabase;
        console.log('✅ Supabase client configurado en ApiStorage');
    }

    setAuthToken(token) {
        this.token = token;
        console.log('🔐 Token configurado en ApiStorage');
    }
}

export const apiStorage = new ApiStorage();