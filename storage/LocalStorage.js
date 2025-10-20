// storage/LocalStorage.js
import { Note } from '../core/Note.js';

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
                    
                    // Validar que sea un array
                    if (!Array.isArray(data.notes)) {
                        throw new Error('Formato de datos inválido');
                    }
                    
                    resolve(data.notes);
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
                const notes = Array.from(notesMap.values()).map(note => note.toJSON());
                const data = {
                    version: this.version,
                    lastSaved: Date.now(),
                    notes: notes
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
                notes: notes
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
                
                // Validar estructura del archivo importado
                if (!importedData.notes || !Array.isArray(importedData.notes)) {
                    throw new Error('Formato de archivo inválido');
                }
                
                const importedNotes = importedData.notes.map(noteData => {
                    // Validar estructura básica de cada nota
                    if (typeof noteData.title !== 'string' || typeof noteData.content !== 'string') {
                        throw new Error('Nota con formato inválido');
                    }
                    
                    return Note.fromJSON(noteData);
                });
                
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