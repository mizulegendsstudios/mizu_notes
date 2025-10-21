// src/frontend/core/storage/LocalStorage.js
import { Note } from '../../../shared/types/Note.js';

export class LocalStorage {
    constructor() {
        this.storageKey = 'mizuNotes';
        this.version = '1.0';
    }

    async getNotes() {
        return new Promise((resolve, reject) => {
            try {
                const saved = localStorage.getItem(this.storageKey);
                if (saved) {
                    const data = JSON.parse(saved);
                    
                    if (!Array.isArray(data.notes)) {
                        throw new Error('Formato de datos inválido');
                    }
                    
                    const notes = data.notes.map(noteData => Note.fromJSON(noteData));
                    resolve(notes);
                } else {
                    resolve([]);
                }
            } catch (error) {
                console.error('Error loading notes from localStorage:', error);
                reject(new Error('No se pudieron cargar las notas del almacenamiento local'));
            }
        });
    }

    async saveNotes(notesMap) {
        return new Promise((resolve, reject) => {
            try {
                const notes = Array.from(notesMap.values()).map(note => {
                    if (!(note instanceof Note)) {
                        return Note.fromJSON(note);
                    }
                    return note;
                });
                
                const data = {
                    version: this.version,
                    lastSaved: Date.now(),
                    notes: notes.map(note => note.toJSON())
                };
                
                localStorage.setItem(this.storageKey, JSON.stringify(data));
                resolve();
            } catch (error) {
                console.error('Error saving notes to localStorage:', error);
                reject(new Error('No se pudieron guardar las notas en el almacenamiento local'));
            }
        });
    }

    async exportNotes() {
        try {
            const notes = await this.getNotes();
            return JSON.stringify({
                version: this.version,
                exportedAt: Date.now(),
                notes: notes.map(note => note.toJSON())
            }, null, 2);
        } catch (error) {
            console.error('Error exporting notes:', error);
            throw new Error('No se pudieron exportar las notas');
        }
    }

    async importNotes(data) {
        return new Promise((resolve, reject) => {
            try {
                const importedData = JSON.parse(data);
                
                if (!importedData.notes || !Array.isArray(importedData.notes)) {
                    throw new Error('Formato de archivo inválido');
                }
                
                const importedNotes = importedData.notes.map(noteData => Note.fromJSON(noteData));
                resolve(importedNotes);
            } catch (error) {
                console.error('Error importing notes:', error);
                reject(new Error('No se pudieron importar las notas: formato de archivo inválido'));
            }
        });
    }

    async clear() {
        return new Promise((resolve) => {
            localStorage.removeItem(this.storageKey);
            resolve();
        });
    }

    getStorageInfo() {
        const saved = localStorage.getItem(this.storageKey);
        if (!saved) return { size: 0, noteCount: 0 };
        
        const data = JSON.parse(saved);
        return {
            size: new Blob([saved]).size,
            noteCount: data.notes ? data.notes.length : 0,
            lastSaved: data.lastSaved
        };
    }
}
