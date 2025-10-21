// core/NotesManager.js
import { Note } from '../../../shared/types/Note.js';

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
            notes.forEach(note => {
                this.notes.set(note.id, note);
            });

            // CAMBIO CLAVE: SI NO HAY NOTAS, CREAR UNA INMEDIATAMENTE
            if (this.notes.size === 0) {
                await this.createFirstNote();
            } else {
                // SI HAY NOTAS, SELECCIONAR LA ÚLTIMA EDITADA
                const lastEdited = this.getLastEditedNoteId();
                this.setCurrentNote(lastEdited);
            }
        } catch (error) {
            console.error('Error loading notes:', error);
            // EN CASO DE ERROR, CREAR NOTA POR DEFECTO
            await this.createFirstNote();
        }
    }

    // NUEVO MÉTODO: CREAR PRIMERA NOTA
    async createFirstNote() {
        const noteId = this.generateId();
        const note = new Note(noteId, 'Mi Primera Nota', '¡Bienvenido a Mizu Notes!\n\nComienza a escribir tus ideas aquí...');
        this.notes.set(noteId, note);
        this.currentNoteId = noteId;
        await this.save();
        this.emit('noteCreated', note);
        this.emit('notesChanged', Array.from(this.notes.values()));
        this.emit('currentNoteChanged', noteId);
        return note;
    }

    createNote(title = 'Nueva Nota', content = '') {
        const noteId = this.generateId();
        const note = new Note(noteId, title, content);
        this.notes.set(noteId, note);
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
            this.currentNoteId = id;
            this.emit('currentNoteChanged', id);
        }
    }

    updateNote(id, title, content) {
        const note = this.notes.get(id);
        if (note) {
            note.update(title, content);
            this.emit('noteUpdated', note);
            this.emit('notesChanged', Array.from(this.notes.values()));
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
                const remainingNotes = Array.from(this.notes.values());
                if (remainingNotes.length > 0) {
                    const lastEdited = remainingNotes.sort((a, b) => b.updatedAt - a.updatedAt)[0];
                    this.setCurrentNote(lastEdited.id);
                } else {
                    this.currentNoteId = null;
                    this.emit('currentNoteChanged', null);
                }
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
        const totalChars = Array.from(this.notes.values())
            .reduce((sum, note) => sum + note.content.length, 0);
        
        return { totalNotes, totalChars };
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    async save() {
        const notesData = Array.from(this.notes.values());
        await this.storage.saveNotes(this.notes);
        this.emit('notesSaved');
    }

    async exportNotes() {
        return await this.storage.exportNotes();
    }

    async importNotes(data) {
        const importedNotes = await this.storage.importNotes(data);
        importedNotes.forEach(noteData => {
            const note = Note.fromJSON(noteData);
            note.id = this.generateId();
            this.notes.set(note.id, note);
        });
        this.emit('notesImported', importedNotes);
        this.emit('notesChanged', Array.from(this.notes.values()));
        return importedNotes;
    }
}