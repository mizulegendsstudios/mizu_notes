// src/frontend/core/services/NotesManager.js
import { Note } from '../../../shared/types/Note.js';

export class NotesManager {
    constructor(storage) {
        this.storage = storage;
        this.notes = new Map();
        this.currentNoteId = null;
        this.listeners = new Map();
        this.isInitialized = false;
    }

    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }

    async initialize() {
        try {
            const notes = await this.storage.getNotes();
            this.notes.clear();
            
            // Asegurar que todas las notas son instancias de Note
            notes.forEach(noteData => {
                const note = noteData instanceof Note ? noteData : Note.fromJSON(noteData);
                this.notes.set(note.id, note);
            });

            this.isInitialized = true;
            this.emit('notesLoaded', Array.from(this.notes.values()));

            // SI NO HAY NOTAS, CREAR UNA INMEDIATAMENTE
            if (this.notes.size === 0) {
                await this.createFirstNote();
            } else {
                // SI HAY NOTAS, SELECCIONAR LA ÚLTIMA EDITADA
                const lastEditedId = this.getLastEditedNoteId();
                this.setCurrentNote(lastEditedId);
            }
            
        } catch (error) {
            console.error('Error initializing notes manager:', error);
            // EN CASO DE ERROR, CREAR NOTA POR DEFECTO
            await this.createFirstNote();
            throw error;
        }
    }

    async createFirstNote() {
        const note = this.createNote('Mi Primera Nota', '¡Bienvenido a Mizu Notes!\n\nComienza a escribir tus ideas aquí...');
        this.setCurrentNote(note.id);
        await this.save();
        return note;
    }

    createNote(title = 'Nueva Nota', content = '') {
        const id = this.generateId();
        const note = new Note(id, title, content);
        this.notes.set(id, note);
        this.emit('noteCreated', note);
        this.emit('notesChanged', Array.from(this.notes.values()));
        return note;
    }

    getNote(id) {
        return this.notes.get(id);
    }

    getCurrentNote() {
        return this.currentNoteId ? this.notes.get(this.currentNoteId) : null;
    }

    setCurrentNote(id) {
        if (this.notes.has(id) || id === null) {
            const previousNoteId = this.currentNoteId;
            this.currentNoteId = id;
            
            // Solo emitir si realmente cambió la nota
            if (previousNoteId !== id) {
                this.emit('currentNoteChanged', id);
            }
            return true;
        }
        return false;
    }

    updateNote(id, title, content) {
        const note = this.notes.get(id);
        if (note) {
            const previousTitle = note.title;
            const previousContent = note.content;
            
            note.update(title, content);
            
            // Solo emitir si realmente hubo cambios
            if (previousTitle !== title || previousContent !== content) {
                this.emit('noteUpdated', note);
                this.emit('notesChanged', Array.from(this.notes.values()));
            }
            return note;
        }
        return null;
    }

    deleteNote(id) {
        const note = this.notes.get(id);
        if (note) {
            this.notes.delete(id);
            this.emit('noteDeleted', id);
            this.emit('notesChanged', Array.from(this.notes.values()));
            
            if (this.currentNoteId === id) {
                this.setCurrentNote(this.getLastEditedNoteId());
            }
            return true;
        }
        return false;
    }

    getNotes() {
        return Array.from(this.notes.values());
    }

    getFilteredNotes(searchTerm = '') {
        const allNotes = this.getNotes();
        if (!searchTerm) return allNotes;
        
        const term = searchTerm.toLowerCase();
        return allNotes.filter(note => 
            note.title.toLowerCase().includes(term) ||
            note.content.toLowerCase().includes(term)
        );
    }

    getLastEditedNoteId() {
        const notes = this.getNotes();
        if (notes.length === 0) return null;
        return notes.sort((a, b) => b.updatedAt - a.updatedAt)[0].id;
    }

    getStats() {
        const totalNotes = this.notes.size;
        const totalChars = this.getNotes()
            .reduce((sum, note) => sum + note.getCharacterCount(), 0);
        
        return { totalNotes, totalChars };
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    async save() {
        try {
            await this.storage.saveNotes(this.notes);
            this.emit('notesSaved');
        } catch (error) {
            console.error('Error saving notes:', error);
            throw error;
        }
    }

    async exportNotes() {
        return await this.storage.exportNotes();
    }

    async importNotes(data) {
        const importedNotes = await this.storage.importNotes(data);
        importedNotes.forEach(noteData => {
            const note = Note.fromJSON(noteData);
            note.id = this.generateId(); // Nuevo ID para evitar conflictos
            this.notes.set(note.id, note);
        });
        this.emit('notesImported', importedNotes);
        this.emit('notesChanged', Array.from(this.notes.values()));
        return importedNotes;
    }

    // Método para verificar si está inicializado
    isReady() {
        return this.isInitialized && this.notes.size > 0 && this.currentNoteId !== null;
    }
}