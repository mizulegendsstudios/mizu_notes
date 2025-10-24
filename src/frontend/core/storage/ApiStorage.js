// src/frontend/core/storage/ApiStorage.js - VERSIÓN ULTRA SIMPLE
import { Note } from '../../../shared/types/Note.js';
import { notificationService } from '../services/NotificationService.js';

export class ApiStorage {
    constructor() {
        this.baseURL = 'https://mizu-notes-git-gh-pages-mizulegendsstudios-admins-projects.vercel.app/api';
        this.isOnline = false;
        console.log('🚀 ApiStorage con URL:', this.baseURL);
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        console.log('🌐 FETCH:', url);
        
        try {
            const response = await fetch(url, {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                body: options.body ? JSON.stringify(options.body) : undefined
            });

            console.log('📡 STATUS:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ FETCH ERROR:', error);
            throw error;
        }
    }

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
            notificationService.success(`Cargadas ${notesMap.size} notas del servidor`);
            return notesMap;
            
        } catch (error) {
            console.error('❌ FAILED TO GET NOTES FROM SERVER:', error);
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
            console.log('📁 LOCAL NOTES:', notesMap.size);
            return notesMap;
        } catch (error) {
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
            console.error('❌ Error saving to localStorage:', error);
        }
    }

    async saveNotes(notesMap) {
        try {
            console.log('💾 SAVING NOTES TO SERVER...');
            this.saveNotesToLocalStorage(notesMap);
            notificationService.success('Notas guardadas');
            return [];
        } catch (error) {
            console.error('❌ Error saving notes:', error);
            this.saveNotesToLocalStorage(notesMap);
            notificationService.info('Notas guardadas localmente');
            return [];
        }
    }

    async initialize() {
        console.log('✅ API STORAGE INITIALIZED');
        return true;
    }

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
            notificationService.error('Sin conexión al servidor');
            return false;
        }
    }

    setSupabaseClient(supabase) {
        console.log('🔐 Supabase client set');
    }

    setAuthToken(token) {
        console.log('🔐 Auth token set');
    }
}

export const apiStorage = new ApiStorage();