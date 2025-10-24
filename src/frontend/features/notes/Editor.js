// src/frontend/features/notes/Editor.js - VERSIÓN CORREGIDA
export class Editor {
    constructor(notesManager) {
        this.notesManager = notesManager;
        this.elements = {};
        this.autoSaveTimeout = null;
        this.isEditing = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.update(); // Actualizar inmediatamente
    }

    initializeElements() {
        this.elements = {
            noteTitle: document.getElementById('noteTitle'),
            noteContent: document.getElementById('noteContent'),
            autoSaveIndicator: document.getElementById('autoSaveIndicator'),
            lastSaved: document.getElementById('lastSaved'),
            charCount: document.getElementById('charCount'),
            wordCount: document.getElementById('wordCount')
        };
    }

    setupEventListeners() {
        // Eventos de entrada
        this.elements.noteTitle.addEventListener('input', () => this.handleNoteChange());
        this.elements.noteContent.addEventListener('input', () => this.handleNoteChange());

        // EVENTOS CORREGIDOS - usar los que NotesManager realmente emite
        this.notesManager.subscribe('noteSelected', (note) => {
            console.log('Editor: Nota seleccionada recibida', note?.id);
            this.update();
        });

        this.notesManager.subscribe('notesUpdated', () => {
            console.log('Editor: Notas actualizadas recibidas');
            this.update();
        });

        this.notesManager.subscribe('noteUpdated', (note) => {
            // Si la nota actualizada es la que estamos viendo, actualizar
            const currentNote = this.notesManager.getCurrentNote();
            if (currentNote && currentNote.id === note.id) {
                console.log('Editor: Nota actualizada recibida', note.id);
                this.showNote(note);
            }
        });

        this.notesManager.subscribe('notesCleared', () => {
            console.log('Editor: Notas limpiadas recibidas');
            this.showEmptyState();
        });
    }

    handleNoteChange() {
        const currentNote = this.notesManager.getCurrentNote();
        if (!currentNote) {
            console.warn('Editor: Intento de editar sin nota seleccionada');
            return;
        }

        this.isEditing = true;
        const title = this.elements.noteTitle.value;
        const content = this.elements.noteContent.value;
        
        // LLAMADA CORREGIDA - pasar objeto con updates
        this.notesManager.updateNote(currentNote.id, {
            title: title,
            content: content
        });
        
        // Programar guardado automático
        this.scheduleAutoSave();
        
        // Actualizar estadísticas
        this.updateStats();
    }

    scheduleAutoSave() {
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(async () => {
            if (this.isEditing) {
                try {
                    await this.notesManager.save();
                    this.showAutoSaveIndicator();
                    this.isEditing = false;
                } catch (error) {
                    console.error('Auto-save failed:', error);
                }
            }
        }, 1000);
    }

    update() {
        const currentNote = this.notesManager.getCurrentNote();
        
        if (!currentNote) {
            this.showEmptyState();
            return;
        }

        this.showNote(currentNote);
    }

    showEmptyState() {
        this.elements.noteTitle.value = '';
        this.elements.noteContent.value = '';
        this.elements.noteTitle.placeholder = 'Selecciona o crea una nota';
        this.elements.noteContent.placeholder = 'Selecciona o crea una nota para empezar a escribir';
        this.elements.noteTitle.disabled = true;
        this.elements.noteContent.disabled = true;
        this.updateStats();
        
        console.log('Editor: Mostrando estado vacío');
    }

    showNote(note) {
        if (!note) return;
        
        // Solo actualizar si no estamos editando actualmente
        if (!this.isEditing) {
            if (this.elements.noteTitle.value !== note.title) {
                this.elements.noteTitle.value = note.title || '';
            }
            if (this.elements.noteContent.value !== note.content) {
                this.elements.noteContent.value = note.content || '';
            }
        }
        
        this.elements.noteTitle.placeholder = 'Título de la nota...';
        this.elements.noteContent.placeholder = 'Escribe tu nota aquí...';
        this.elements.noteTitle.disabled = false;
        this.elements.noteContent.disabled = false;
        
        this.updateStats();
        this.updateLastSaved(note.updatedAt);
        
        console.log(`Editor: Mostrando nota "${note.title}"`);
    }

    updateStats() {
        if (!this.elements.charCount || !this.elements.wordCount) return;
        
        const currentContent = this.elements.noteContent.value || '';
        const charCount = currentContent.length;
        const wordCount = currentContent.trim() ? currentContent.trim().split(/\s+/).length : 0;
        
        this.elements.charCount.textContent = `${charCount} caracteres`;
        this.elements.wordCount.textContent = `${wordCount} palabras`;
    }

    updateLastSaved(timestamp) {
        if (this.elements.lastSaved && timestamp) {
            const date = new Date(timestamp);
            this.elements.lastSaved.textContent = `Última edición: ${date.toLocaleTimeString()}`;
        }
    }

    showAutoSaveIndicator() {
        if (!this.elements.autoSaveIndicator || !this.elements.lastSaved) return;
        
        this.elements.autoSaveIndicator.classList.add('visible');
        this.elements.lastSaved.textContent = `Última edición: ${new Date().toLocaleTimeString()}`;
        
        setTimeout(() => {
            if (this.elements.autoSaveIndicator) {
                this.elements.autoSaveIndicator.classList.remove('visible');
            }
        }, 2000);
    }

    focusTitle() {
        setTimeout(() => {
            if (this.elements.noteTitle && !this.elements.noteTitle.disabled) {
                this.elements.noteTitle.focus();
                this.elements.noteTitle.select();
            }
        }, 100);
    }

    focusContent() {
        setTimeout(() => {
            if (this.elements.noteContent && !this.elements.noteContent.disabled) {
                this.elements.noteContent.focus();
            }
        }, 100);
    }

    clear() {
        this.elements.noteTitle.value = '';
        this.elements.noteContent.value = '';
        this.updateStats();
    }

    // Método para forzar actualización
    refresh() {
        this.update();
    }

    // Método para limpiar
    destroy() {
        this.elements = {};
    }
}