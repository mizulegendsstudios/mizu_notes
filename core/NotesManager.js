// core/NotesManager.js
import { Note } from './Note.js';

export class NotesManager {
    constructor(storage) {
        this.storage = storage;
        this.notes = new Map();
        this.currentNoteId = null;
        this.listeners = new Map();
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
            notes.forEach(noteData => {
                const note = Note.fromJSON(noteData);
                this.notes.set(note.id, note);
            });
            this.emit('notesLoaded', Array.from(this.notes.values()));
        } catch (error) {
            console.error('Error initializing notes manager:', error);
            throw error;
        }
    }

    createNote(title = 'Nueva Nota', content = '') {
        const id = this.generateId();
        const note = new Note(id, title, content);
        this.notes.set(id, note);
        this.emit('noteCreated', note);
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
            this.currentNoteId = id;
            this.emit('currentNoteChanged', id);
        }
    }

    updateNote(id, title, content) {
        const note = this.notes.get(id);
        if (note) {
            note.update(title, content);
            this.emit('noteUpdated', note);
            return note;
        }
        return null;
    }

    deleteNote(id) {
        const note = this.notes.get(id);
        if (note) {
            this.notes.delete(id);
            this.emit('noteDeleted', id);
            
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
            // Generar nuevo ID para evitar conflictos
            note.id = this.generateId();
            this.notes.set(note.id, note);
        });
        this.emit('notesImported', importedNotes);
        return importedNotes;
    }
}