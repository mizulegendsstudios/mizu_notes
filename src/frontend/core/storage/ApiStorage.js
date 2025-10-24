// src/frontend/core/storage/ApiStorage.js - VERSIÓN CON RUTAS PÚBLICAS
import { Note } from '../../../shared/types/Note.js';
import { notificationService } from '../services/NotificationService.js';

export class ApiStorage {
    constructor(baseURL = 'https://mizu-notes-o96sirmqd-mizulegendsstudios-admins-projects.vercel.app/api') {
        this.baseURL = baseURL;
        this.token = null;
        this.currentUserId = null;
        this.isOnline = false;
        this.supabase = null;
    }

    setAuthToken(token) {
        this.token = token;
        console.log('🔐 ApiStorage: Token configurado');
        if (token) {
            localStorage.setItem('mizu_auth_token', token);
        }
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        console.log('🌐 Haciendo request a:', url);
        
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

            if (options.body) {
                fetchOptions.body = typeof options.body === 'object' 
                    ? JSON.stringify(options.body) 
                    : options.body;
            }

            const response = await fetch(url, fetchOptions);
            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Error en request:', error);
            throw new Error('No se puede conectar con el servidor');
        }
    }

    async getNotes() {
        try {
            console.log('🔍 Obteniendo notas...');
            
            // 🔧 PRIMERO INTENTAR RUTA PÚBLICA
            try {
                const publicResult = await this.makeRequest('/public/notes');
                console.log('✅ Notas públicas obtenidas:', publicResult);
                
                const notesMap = new Map();
                if (publicResult.data && Array.isArray(publicResult.data)) {
                    publicResult.data.forEach(noteData => {
                        const note = new Note(
                            noteData.id,
                            noteData.title,
                            noteData.content,
                            new Date(noteData.created_at),
                            new Date(noteData.updated_at),
                            noteData.version || 1
                        );
                        notesMap.set(note.id, note);
                    });
                }
                
                this.saveNotesToLocalStorage(notesMap);
                return notesMap;
            } catch (publicError) {
                console.log('⚠️ No se pudieron obtener notas públicas, intentando ruta protegida...');
                
                // Si falla la ruta pública, intentar la protegida
                if (this.token) {
                    const protectedResult = await this.makeRequest('/notes');
                    const notesMap = new Map();
                    
                    if (protectedResult.data && Array.isArray(protectedResult.data)) {
                        protectedResult.data.forEach(noteData => {
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
                    
                    this.saveNotesToLocalStorage(notesMap);
                    return notesMap;
                } else {
                    throw publicError;
                }
            }
        } catch (error) {
            console.error('❌ Error obteniendo notas:', error);
            return this.getLocalNotes();
        }
    }

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
            
            localStorage.setItem('mizu_notes', JSON.stringify(notesArray));
        } catch (error) {
            console.error('❌ Error guardando notas locales:', error);
        }
    }

    async saveNotes(notesMap) {
        try {
            console.log('💾 Guardando notas...');
            
            // Intentar guardar en servidor
            const notes = Array.from(notesMap.values());
            
            for (const note of notes) {
                try {
                    const noteData = {
                        title: note.title,
                        content: note.content,
                        version: note.version
                    };
                    
                    if (note.id && !note.id.startsWith('local_')) {
                        await this.makeRequest(`/notes/${note.id}`, {
                            method: 'PUT',
                            body: noteData
                        });
                    } else {
                        const result = await this.makeRequest('/notes', {
                            method: 'POST',
                            body: noteData
                        });
                        
                        if (result.data && result.data.id) {
                            note.id = result.data.id;
                        }
                    }
                } catch (error) {
                    console.error('❌ Error guardando nota en servidor:', error);
                }
            }
            
            // Siempre guardar localmente
            this.saveNotesToLocalStorage(notesMap);
            notificationService.success('Notas guardadas');
            
        } catch (error) {
            console.error('❌ Error guardando notas:', error);
            this.saveNotesToLocalStorage(notesMap);
            notificationService.info('Notas guardadas localmente');
        }
    }

    async initialize() {
        console.log('✅ ApiStorage inicializado');
        return true;
    }

    setSupabaseClient(supabase) {
        this.supabase = supabase;
    }

    async checkConnection() {
        try {
            await this.makeRequest('/health');
            this.isOnline = true;
            console.log('✅ Servidor conectado');
            return true;
        } catch (error) {
            this.isOnline = false;
            console.log('⚠️ Servidor desconectado');
            return false;
        }
    }
}

export const apiStorage = new ApiStorage();