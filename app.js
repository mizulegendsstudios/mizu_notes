// app.js
import { LocalStorage } from './storage/LocalStorage.js';
import { ApiStorage } from './storage/ApiStorage.js';
import { NotesManager } from './core/NotesManager.js';
import { SyncManager } from './core/SyncManager.js';
import { StyleEngine } from './core/StyleEngine.js';
import { Editor } from './ui/Editor.js';
import { Sidebar } from './ui/Sidebar.js';

export class MizuNotesApp {
    constructor() {
        this.storage = null;
        this.notesManager = null;
        this.syncManager = null;
        this.styleEngine = null;
        this.editor = null;
        this.sidebar = null;
        
        this.initializeApp();
    }

    async initializeApp() {
        try {
            // Primero inicializar el motor de estilos
            await this.initializeStyleEngine();
            
            // Luego el resto de la aplicación
            await this.initializeStorage();
            await this.initializeManagers();
            await this.initializeUI();
            await this.loadInitialData();
            this.setupGlobalEventListeners();
            
            console.log('Mizu Notes inicializado correctamente');
        } catch (error) {
            console.error('Error inicializando la aplicación:', error);
            this.showError('Error al inicializar la aplicación');
        }
    }

    async initializeStyleEngine() {
        this.styleEngine = new StyleEngine();
        this.styleEngine.initialize();
        
        // Aplicar tema por defecto o guardado
        const savedTheme = localStorage.getItem('mizuNotes-theme') || 'default';
        this.styleEngine.applyTheme(savedTheme);
    }

    async initializeStorage() {
        this.storage = new LocalStorage();
    }

    async initializeManagers() {
        this.notesManager = new NotesManager(this.storage);
        this.syncManager = new SyncManager(this.storage, this.notesManager);
    }

    async initializeUI() {
        this.editor = new Editor(this.notesManager);
        this.sidebar = new Sidebar(this.notesManager);
        
        // Hacer disponibles globalmente para los event listeners del HTML
        window.app = this;
        
        this.setupUIEventListeners();
        this.setupThemeControls();
    }

    setupThemeControls() {
        // Puedes agregar controles para cambiar temas dinámicamente
        // Por ejemplo, un selector de temas en la interfaz
    }

    // Método para cambiar tema
    changeTheme(themeName) {
        if (this.styleEngine.applyTheme(themeName)) {
            localStorage.setItem('mizuNotes-theme', themeName);
            this.showMessage(`Tema cambiado a: ${themeName}`);
        } else {
            this.showError(`Tema '${themeName}' no encontrado`);
        }
    }

    // ... resto de los métodos permanecen igual
    async loadInitialData() {
        await this.notesManager.initialize();
        this.syncManager.startSyncInterval();
    }

    async createNewNote() {
        const note = this.notesManager.createNote();
        this.notesManager.setCurrentNote(note.id);
        await this.notesManager.save();
        this.editor.focusTitle();
        this.showMessage('Nueva nota creada');
    }

    async deleteCurrentNote() {
        const currentNote = this.notesManager.getCurrentNote();
        if (!currentNote) {
            this.showError('No hay nota seleccionada para eliminar');
            return;
        }

        const noteTitle = currentNote.title || 'esta nota';
        
        if (confirm(`¿Estás seguro de que quieres eliminar "${noteTitle}"?`)) {
            this.notesManager.deleteNote(currentNote.id);
            await this.notesManager.save();
            this.showMessage('Nota eliminada correctamente');
            
            if (this.notesManager.getNotes().length === 0) {
                setTimeout(() => this.createNewNote(), 1000);
            }
        }
    }

    async exportNotes() {
        if (this.notesManager.getNotes().length === 0) {
            this.showError('No hay notas para exportar');
            return;
        }
        
        try {
            const dataStr = await this.notesManager.exportNotes();
            this.downloadFile(dataStr, `mizu-notes-${new Date().toISOString().split('T')[0]}.json`);
            this.showMessage('Notas exportadas correctamente');
        } catch (error) {
            console.error('Error exporting notes:', error);
            this.showError('Error al exportar notas');
        }
    }

    async importNotes() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await this.readFile(file);
                const importedNotes = await this.notesManager.importNotes(text);
                await this.notesManager.save();
                this.showMessage(`${importedNotes.length} notas importadas correctamente`);
            } catch (error) {
                console.error('Error importing notes:', error);
                this.showError('Error al importar notas: archivo inválido');
            }
        };
        
        input.click();
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = () => reject(new Error('Error leyendo archivo'));
            reader.readAsText(file);
        });
    }

    downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    async forceSave() {
        try {
            await this.notesManager.save();
        } catch (error) {
            console.error('Error in force save:', error);
        }
    }

    showMessage(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'success') {
        // Implementación de notificaciones...
    }

    setupUIEventListeners() {
        document.getElementById('newNoteBtn').addEventListener('click', () => this.createNewNote());
        document.getElementById('deleteNoteBtn').addEventListener('click', () => this.deleteCurrentNote());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportNotes());
        document.getElementById('importBtn').addEventListener('click', () => this.importNotes());
    }

    setupGlobalEventListeners() {
        window.addEventListener('beforeunload', () => this.forceSave());
        window.addEventListener('error', (event) => {
            console.error('Error no capturado:', event.error);
            this.showError('Ha ocurrido un error inesperado');
        });
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new MizuNotesApp();
});