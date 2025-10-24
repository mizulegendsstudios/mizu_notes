// src/frontend/core/services/NotesManager.js
import { Note } from '../../../shared/types/Note.js';
import { notificationService } from './NotificationService.js';

export class NotesManager {
    constructor(storage) {
        this.storage = storage;
        this.notes = new Map();
        this.currentNoteId = null;
        this.isReady = false;
        this.eventListeners = new Map();
        
        console.log('📝 NotesManager inicializado');
    }

    async initialize() {
        try {
            await this.loadNotes();
            this.isReady = true;
            
            // Si no hay notas, crear una por defecto
            if (this.notes.size === 0) {
                await this.createFirstNote();
            }
            
            console.log(`✅ NotesManager listo con ${this.notes.size} notas`);
            
        } catch (error) {
            console.error('Error inicializando NotesManager:', error);
            throw error;
        }
    }

    async loadNotes() {
        try {
            const loadedNotes = await this.storage.getNotes();
            
            // Limpiar notas actuales
            this.notes.clear();
            
            // Cargar nuevas notas
            if (loadedNotes && loadedNotes.size > 0) {
                loadedNotes.forEach((note, id) => {
                    this.notes.set(id, note);
                });
                
                // Establecer la última nota editada como actual
                const lastEdited = Array.from(this.notes.values())
                    .sort((a, b) => b.updatedAt - a.updatedAt)[0];
                
                if (lastEdited) {
                    this.currentNoteId = lastEdited.id;
                }
            }
            
            this.notifyUpdate();
            
        } catch (error) {
            console.error('Error cargando notas:', error);
            throw error;
        }
    }

    async save() {
        try {
            await this.storage.saveNotes(this.notes);
            this.emit('notesSaved', this.notes);
        } catch (error) {
            console.error('Error guardando notas:', error);
            notificationService.error('Error al guardar notas');
            throw error;
        }
    }

    createNote(title = 'Nueva Nota', content = '') {
        const noteId = this.generateId();
        const now = Date.now();
        
        const note = new Note(
            noteId,
            title,
            content,
            now,
            now,
            1
        );
        
        this.notes.set(noteId, note);
        this.currentNoteId = noteId;
        
        this.emit('noteCreated', note);
        this.notifyUpdate();
        
        console.log('📄 Nueva nota creada:', noteId);
        
        return note;
    }

    async createFirstNote() {
        const note = this.createNote(
            'Bienvenido a Mizu Notes',
            '¡Bienvenido! 🌊\n\nEsta es tu primera nota en Mizu Notes.\n\nPuedes:\n• Crear nuevas notas con el botón "Nueva Nota"\n• Eliminar notas con el botón "Eliminar"\n• Exportar e importar tus notas\n• Tu trabajo se guarda automáticamente\n\n¡Comienza a escribir!'
        );
        
        await this.save();
        return note;
    }

    getNote(noteId) {
        return this.notes.get(noteId);
    }

    getCurrentNote() {
        return this.currentNoteId ? this.notes.get(this.currentNoteId) : null;
    }

    setCurrentNote(noteId) {
        if (this.notes.has(noteId)) {
            this.currentNoteId = noteId;
            this.emit('noteSelected', this.getNote(noteId));
            this.notifyUpdate();
        } else {
            console.warn('Intento de seleccionar nota inexistente:', noteId);
        }
    }

    updateNote(noteId, updates) {
        const note = this.notes.get(noteId);
        if (!note) {
            console.warn('Intento de actualizar nota inexistente:', noteId);
            return null;
        }

        // Aplicar updates
        if (updates.title !== undefined) note.title = updates.title;
        if (updates.content !== undefined) note.content = updates.content;
        
        note.updatedAt = Date.now();
        note.version++;

        this.emit('noteUpdated', note);
        this.notifyUpdate();

        return note;
    }

    deleteNote(noteId) {
        if (!this.notes.has(noteId)) {
            console.warn('Intento de eliminar nota inexistente:', noteId);
            return false;
        }

        const wasCurrent = this.currentNoteId === noteId;
        
        this.notes.delete(noteId);
        this.emit('noteDeleted', noteId);

        // Si era la nota actual, seleccionar otra
        if (wasCurrent) {
            this.selectNewCurrentNote();
        }

        this.notifyUpdate();
        
        console.log('🗑️ Nota eliminada:', noteId);
        return true;
    }

    selectNewCurrentNote() {
        const remainingNotes = Array.from(this.notes.values());
        
        if (remainingNotes.length > 0) {
            // Seleccionar la última nota editada
            const lastEdited = remainingNotes.sort((a, b) => b.updatedAt - a.updatedAt)[0];
            this.currentNoteId = lastEdited.id;
        } else {
            this.currentNoteId = null;
        }
    }

    getNotes() {
        return this.notes;
    }

    getNotesArray() {
        return Array.from(this.notes.values());
    }

    getNotesCount() {
        return this.notes.size;
    }

    getStats() {
        const notesArray = this.getNotesArray();
        const totalChars = notesArray.reduce((sum, note) => sum + note.content.length, 0);
        const totalWords = notesArray.reduce((sum, note) => {
            const words = note.content.trim() ? note.content.trim().split(/\s+/).length : 0;
            return sum + words;
        }, 0);

        return {
            totalNotes: this.notes.size,
            totalChars,
            totalWords,
            lastUpdated: notesArray.length > 0 ? 
                Math.max(...notesArray.map(note => note.updatedAt)) : 
                null
        };
    }

    clearNotes() {
        const previousSize = this.notes.size;
        this.notes.clear();
        this.currentNoteId = null;
        
        this.emit('notesCleared');
        this.notifyUpdate();
        
        console.log(`🧹 ${previousSize} notas eliminadas`);
    }

    // NUEVO: Método para cambiar el storage dinámicamente
    setStorage(newStorage) {
        this.storage = newStorage;
        console.log('📦 Storage cambiado en NotesManager');
        
        // Opcional: recargar notas con el nuevo storage
        this.loadNotes().catch(error => {
            console.error('Error recargando notas con nuevo storage:', error);
        });
    }

    // NUEVO: Método que Sidebar necesita
    getFilteredNotes(searchTerm = '') {
        // Alias para searchNotes para compatibilidad con Sidebar
        return this.searchNotes(searchTerm);
    }

    // NUEVO: Método para obtener preview de nota
    getNotePreview(note, maxLength = 50) {
        const content = note.content || '';
        return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }

    async exportNotes() {
        try {
            const notesData = this.getNotesArray().map(note => note.toJSON());
            
            const exportData = {
                version: '1.0',
                exportedAt: Date.now(),
                noteCount: notesData.length,
                notes: notesData
            };
            
            return JSON.stringify(exportData, null, 2);
            
        } catch (error) {
            console.error('Error exportando notas:', error);
            throw new Error('No se pudieron exportar las notas');
        }
    }

    async importNotes(data) {
        try {
            const importedData = JSON.parse(data);
            
            if (!importedData.notes || !Array.isArray(importedData.notes)) {
                throw new Error('Formato de archivo inválido');
            }

            let importedCount = 0;
            const conflictNotes = [];

            for (const noteData of importedData.notes) {
                try {
                    // Validar datos básicos de la nota
                    if (!noteData.id || !noteData.title) {
                        console.warn('Nota inválida omitida:', noteData);
                        continue;
                    }

                    // Generar nuevo ID para evitar conflictos
                    const newId = this.generateId();
                    
                    const note = new Note(
                        newId,
                        noteData.title,
                        noteData.content || '',
                        noteData.createdAt || Date.now(),
                        noteData.updatedAt || Date.now(),
                        noteData.version || 1
                    );

                    this.notes.set(newId, note);
                    importedCount++;

                } catch (noteError) {
                    console.warn('Error importando nota individual:', noteError);
                    conflictNotes.push(noteData);
                }
            }

            // Si se importaron notas, establecer la primera como actual
            if (importedCount > 0 && !this.currentNoteId) {
                const firstNote = Array.from(this.notes.values())[0];
                this.currentNoteId = firstNote.id;
            }

            this.notifyUpdate();
            await this.save();

            return {
                success: true,
                importedCount,
                conflictCount: conflictNotes.length,
                conflicts: conflictNotes
            };

        } catch (error) {
            console.error('Error importando notas:', error);
            throw new Error('No se pudieron importar las notas: ' + error.message);
        }
    }

    searchNotes(query) {
        if (!query || query.trim() === '') {
            return this.getNotesArray();
        }

        const searchTerm = query.toLowerCase().trim();
        
        return this.getNotesArray().filter(note => {
            return note.title.toLowerCase().includes(searchTerm) ||
                   note.content.toLowerCase().includes(searchTerm);
        });
    }

    // Sistema de eventos
    subscribe(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event).add(callback);
    }

    unsubscribe(event, callback) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).delete(callback);
        }
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error en event listener para ${event}:`, error);
                }
            });
        }
    }

    notifyUpdate() {
        this.emit('notesUpdated', {
            notes: this.notes,
            currentNote: this.getCurrentNote(),
            stats: this.getStats()
        });
    }

    // Utilidades
    generateId() {
        return 'note_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    isReady() {
        return this.isReady;
    }

    // Métodos para debugging
    debugInfo() {
        return {
            totalNotes: this.notes.size,
            currentNoteId: this.currentNoteId,
            currentNote: this.getCurrentNote(),
            storageType: this.storage.constructor.name,
            isReady: this.isReady,
            stats: this.getStats()
        };
    }

    // Método para crear nota de emergencia
    async createEmergencyNote() {
        console.warn('Creando nota de emergencia...');
        
        const note = this.createNote(
            'Nota de Emergencia',
            'Se produjo un error en la aplicación. Esta es una nota de respaldo.\n\n' +
            'Fecha: ' + new Date().toLocaleString() + '\n' +
            'Notas recuperadas: ' + this.notes.size
        );
        
        try {
            await this.save();
            return note;
        } catch (error) {
            console.error('Error incluso guardando nota de emergencia:', error);
            return note;
        }
    }

    // Método para limpiar y resetear completamente
    async reset() {
        console.warn('Reseteando NotesManager...');
        
        this.notes.clear();
        this.currentNoteId = null;
        this.isReady = false;
        
        this.emit('managerReset');
        this.notifyUpdate();
        
        // Crear una nueva nota por defecto
        await this.createFirstNote();
    }
}

// Exportar instancia global si es necesario
let globalNotesManager = null;

export function getGlobalNotesManager() {
    return globalNotesManager;
}

export function setGlobalNotesManager(manager) {
    globalNotesManager = manager;
}