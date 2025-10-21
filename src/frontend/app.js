// src/frontend/app.js
import { LocalStorage } from './core/storage/LocalStorage.js';
import { ApiStorage } from './core/storage/ApiStorage.js';
import { NotesManager } from './core/services/NotesManager.js';
import { SyncManager } from './core/services/SyncManager.js';
import { StyleEngine } from './core/styles/StyleEngine.js';
import { Editor } from './features/notes/Editor.js';
import { Sidebar } from './features/notes/Sidebar.js';

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
        
        // CORREGIDO: Solo aplicar tema si existe
        const savedTheme = localStorage.getItem('mizuNotes-theme');
        if (savedTheme && this.styleEngine.getRegisteredThemes().includes(savedTheme)) {
            this.styleEngine.applyTheme(savedTheme);
        }
        // Si no hay tema guardado, usar el que viene por defecto del StyleEngine
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

    async loadInitialData() {
        try {
            await this.notesManager.initialize();
            
            // VERIFICAR QUE TODO ESTÉ LISTO
            if (this.notesManager.isReady()) {
                console.log('App: Notas cargadas y lista para usar');
            } else {
                console.warn('App: El administrador de notas no está listo');
                // FORZAR CREACIÓN DE NOTA SI ES NECESARIO
                if (this.notesManager.getNotes().length === 0) {
                    await this.notesManager.createFirstNote();
                }
            }
            
            this.syncManager.startSyncInterval();
            
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
            // CREAR NOTA DE EMERGENCIA SI TODO FALLA
            await this.createEmergencyNote();
        }
    }

    async createEmergencyNote() {
        console.log('App: Creando nota de emergencia');
        const note = this.notesManager.createNote('Nota de Emergencia', 'Se produjo un error al cargar las notas. Esta es una nota nueva.');
        this.notesManager.setCurrentNote(note.id);
        await this.notesManager.save();
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
            
            // SI NO QUEDAN NOTAS, CREAR UNA NUEVA AUTOMÁTICAMENTE
            if (this.notesManager.getNotes().length === 0) {
                setTimeout(() => {
                    this.createNewNote();
                }, 1000);
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
        // Implementación simple de notificación
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            background-color: ${type === 'success' ? '#4bb543' : '#e63946'};
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
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
        });
    }

    // Método para cambiar entre almacenamiento local y API
    async switchToApiStorage(baseURL) {
        try {
            this.storage = new ApiStorage(baseURL);
            await this.storage.initialize();
            await this.reinitializeApp();
            this.showMessage('Cambiado a modo API');
        } catch (error) {
            console.error('Error cambiando a API storage:', error);
            this.showError('Error al conectar con la API');
        }
    }

    async switchToLocalStorage() {
        this.storage = new LocalStorage();
        await this.reinitializeApp();
        this.showMessage('Cambiado a modo local');
    }

    async reinitializeApp() {
        this.syncManager.stopSyncInterval();
        await this.initializeManagers();
        await this.loadInitialData();
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new MizuNotesApp();
});