// src/frontend/app.js - VERSIÓN CORREGIDA
import { LocalStorage } from './core/storage/LocalStorage.js';
import { ApiStorage } from './core/storage/ApiStorage.js';
import { NotesManager } from './core/services/NotesManager.js';
import { SyncManager } from './core/services/SyncManager.js';
import { AuthManager } from './core/services/AuthManager.js'; // NUEVO
import { StyleEngine } from './core/styles/StyleEngine.js';
import { Editor } from './features/notes/Editor.js';
import { Sidebar } from './features/notes/Sidebar.js';

export class MizuNotesApp {
    constructor() {
        this.storage = null;
        this.notesManager = null;
        this.syncManager = null;
        this.authManager = null; // NUEVO
        this.styleEngine = null;
        this.editor = null;
        this.sidebar = null;
        
        this.initializeApp();
    }

    async initializeApp() {
        try {
            // 1. Inicializar storage (decidir entre local y API)
            await this.initializeStorage();
            
            // 2. Inicializar managers
            await this.initializeManagers();
            
            // 3. Inicializar AuthManager (¡IMPORTANTE!)
            await this.initializeAuthManager();
            
            // 4. Inicializar UI y estilos
            await this.initializeStyleEngine();
            await this.initializeUI();
            await this.loadInitialData();
            
            // 5. Configurar event listeners
            this.setupGlobalEventListeners();
            
            console.log('🎉 Mizu Notes inicializado correctamente');
            
        } catch (error) {
            console.error('Error inicializando la aplicación:', error);
            this.showError('Error al inicializar la aplicación');
        }
    }

    async initializeStorage() {
        // Siempre empezar con LocalStorage por defecto
        this.storage = new LocalStorage();
        console.log('💾 Storage inicializado: LocalStorage');
    }

    async initializeManagers() {
        this.notesManager = new NotesManager(this.storage);
        this.syncManager = new SyncManager(this.storage, this.notesManager);
    }

    async initializeAuthManager() {
        // NUEVO: AuthManager conecta Supabase con el storage y notes
        this.authManager = new AuthManager(this.storage, this.notesManager);
        
        // Hacer disponible globalmente
        window.authManager = this.authManager;
        
        console.log('🔐 AuthManager inicializado');
    }

    async initializeStyleEngine() {
        this.styleEngine = new StyleEngine();
        this.styleEngine.initialize();
        
        const savedTheme = localStorage.getItem('mizuNotes-theme');
        if (savedTheme && this.styleEngine.getRegisteredThemes().includes(savedTheme)) {
            this.styleEngine.applyTheme(savedTheme);
        }
    }

    async initializeUI() {
        this.editor = new Editor(this.notesManager);
        this.sidebar = new Sidebar(this.notesManager);
        
        // Hacer disponibles globalmente
        window.app = this;
        
        this.setupUIEventListeners();
        this.setupAuthUI(); // NUEVO
    }

    // NUEVO: Configurar UI de autenticación
    setupAuthUI() {
        // Aquí puedes agregar botones de login/logout en tu HTML
        // Por ejemplo:
        this.createAuthButtons();
    }

    createAuthButtons() {
        // Buscar contenedor de auth o crear uno
        let authContainer = document.getElementById('auth-container');
        if (!authContainer) {
            authContainer = document.createElement('div');
            authContainer.id = 'auth-container';
            authContainer.style.cssText = `
                position: absolute;
                top: 20px;
                right: 20px;
                display: flex;
                gap: 10px;
            `;
            document.querySelector('.toolbar').appendChild(authContainer);
        }

        // Crear botones de auth
        const loginBtn = document.createElement('button');
        loginBtn.textContent = '🔐 Login';
        loginBtn.className = 'toolbar-btn';
        loginBtn.onclick = () => this.showLoginModal();

        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = '🚪 Logout';
        logoutBtn.className = 'toolbar-btn danger';
        logoutBtn.onclick = () => this.authManager.logout();

        authContainer.innerHTML = '';
        authContainer.appendChild(loginBtn);
        authContainer.appendChild(logoutBtn);

        // Actualizar visibilidad según estado de auth
        this.updateAuthUI();
    }

    updateAuthUI() {
        const authContainer = document.getElementById('auth-container');
        if (!authContainer) return;

        const isAuthenticated = this.authManager.isUserAuthenticated();
        const user = this.authManager.getCurrentUser();
        
        if (isAuthenticated && user) {
            authContainer.innerHTML = `
                <span style="color: var(--text-light); margin-right: 10px;">
                    👤 ${user.email}
                </span>
                <button class="toolbar-btn danger" onclick="app.authManager.logout()">
                    🚪 Logout
                </button>
            `;
        } else {
            authContainer.innerHTML = `
                <button class="toolbar-btn" onclick="app.showLoginModal()">
                    🔐 Login
                </button>
            `;
        }
    }

    showLoginModal() {
        // Implementar un modal de login simple
        const email = prompt('Email:');
        const password = prompt('Password:');
        
        if (email && password) {
            this.authManager.login(email, password)
                .then(result => {
                    if (!result.success) {
                        this.showError(result.error);
                    }
                });
        }
    }

    async loadInitialData() {
        try {
            await this.notesManager.initialize();
            
            if (this.notesManager.getNotes().size === 0) {
                await this.notesManager.createFirstNote();
            }
            
            this.syncManager.startSyncInterval();
            
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
            await this.createEmergencyNote();
        }
    }

    async createEmergencyNote() {
        console.log('App: Creando nota de emergencia');
        const note = this.notesManager.createNote('Nota de Emergencia', 'Se produjo un error al cargar las notas. Esta es una nota nueva.');
        this.notesManager.setCurrentNote(note.id);
        await this.notesManager.save();
    }

    // ... (el resto de los métodos permanecen igual)
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
            
            if (this.notesManager.getNotes().size === 0) {
                setTimeout(() => {
                    this.createNewNote();
                }, 1000);
            }
        }
    }

    async exportNotes() {
        if (this.notesManager.getNotes().size === 0) {
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
        
        // NUEVO: Escuchar eventos de auth para actualizar UI
        window.addEventListener('mizu:userLoggedIn', () => {
            this.updateAuthUI();
            this.switchToApiStorage();
        });
        
        window.addEventListener('mizu:userLoggedOut', () => {
            this.updateAuthUI();
            this.switchToLocalStorage();
        });
    }

    async switchToApiStorage() {
        try {
            this.storage = new ApiStorage();
            await this.storage.initialize();
            
            // Re-inicializar managers con nuevo storage
            this.notesManager.setStorage(this.storage);
            this.syncManager = new SyncManager(this.storage, this.notesManager);
            
            this.showMessage('Modo online activado');
        } catch (error) {
            console.error('Error cambiando a API storage:', error);
            this.showError('Error al conectar con la API');
        }
    }

    async switchToLocalStorage() {
        this.storage = new LocalStorage();
        
        // Re-inicializar managers con storage local
        this.notesManager.setStorage(this.storage);
        this.syncManager = new SyncManager(this.storage, this.notesManager);
        
        this.showMessage('Modo local activado');
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new MizuNotesApp();
});