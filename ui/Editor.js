// ui/Editor.js
export class Editor {
    constructor(notesManager) {
        this.notesManager = notesManager;
        this.elements = {};
        this.autoSaveTimeout = null;
        
        this.initializeElements();
        this.setupEventListeners();
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

        // Suscribirse a cambios del administrador de notas
        this.notesManager.subscribe('currentNoteChanged', (noteId) => {
            this.update();
        });
    }

    handleNoteChange() {
        const currentNote = this.notesManager.getCurrentNote();
        if (!currentNote) return;

        const title = this.elements.noteTitle.value;
        const content = this.elements.noteContent.value;
        
        this.notesManager.updateNote(currentNote.id, title, content);
        
        // Programar guardado automático
        this.scheduleAutoSave();
        
        // Actualizar estadísticas
        this.updateStats();
    }

    scheduleAutoSave() {
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(async () => {
            try {
                await this.notesManager.save();
                this.showAutoSaveIndicator();
            } catch (error) {
                console.error('Auto-save failed:', error);
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
    }

    showNote(note) {
        this.elements.noteTitle.value = note.title;
        this.elements.noteContent.value = note.content;
        this.elements.noteTitle.placeholder = 'Título de la nota...';
        this.elements.noteContent.placeholder = 'Escribe tu nota aquí...';
        this.elements.noteTitle.disabled = false;
        this.elements.noteContent.disabled = false;
        this.updateStats();
    }

    updateStats() {
        const currentContent = this.elements.noteContent.value;
        const charCount = currentContent.length;
        const wordCount = currentContent.trim() ? currentContent.trim().split(/\s+/).length : 0;
        
        this.elements.charCount.textContent = `${charCount} caracteres`;
        this.elements.wordCount.textContent = `${wordCount} palabras`;
    }

    showAutoSaveIndicator() {
        this.elements.autoSaveIndicator.classList.add('visible');
        this.elements.lastSaved.textContent = `Última edición: ${new Date().toLocaleTimeString()}`;
        
        setTimeout(() => {
            this.elements.autoSaveIndicator.classList.remove('visible');
        }, 2000);
    }

    focusTitle() {
        setTimeout(() => {
            this.elements.noteTitle.focus();
            this.elements.noteTitle.select();
        }, 100);
    }

    focusContent() {
        setTimeout(() => {
            this.elements.noteContent.focus();
        }, 100);
    }

    clear() {
        this.elements.noteTitle.value = '';
        this.elements.noteContent.value = '';
        this.updateStats();
    }
}