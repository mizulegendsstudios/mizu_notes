// src/frontend/core/services/AuthManager.js
import { SupabaseAuth } from '../auth/SupabaseClient.js';
import { notificationService } from './NotificationService.js';

export class AuthManager {
    constructor(storage, notesManager) {
        this.auth = new SupabaseAuth();
        this.storage = storage;
        this.notesManager = notesManager;
        this.isAuthenticated = false;
        this.currentUser = null;
        
        this.initialize();
    }

    async initialize() {
        // Verificar sesión existente al cargar la app
        await this.checkExistingSession();
        
        // Escuchar cambios de autenticación de Supabase
        this.setupAuthListeners();
    }

    async checkExistingSession() {
        const sessionResult = await this.auth.initializeSession();
        if (sessionResult.success && sessionResult.user) {
            this.handleLoginSuccess(sessionResult.user, sessionResult.session);
        }
    }

    setupAuthListeners() {
        // Escuchar cambios de estado de autenticación de Supabase
        this.auth.supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔐 Estado de autenticación cambiado:', event);
            
            switch (event) {
                case 'SIGNED_IN':
                    this.handleLoginSuccess(session.user, session);
                    break;
                    
                case 'SIGNED_OUT':
                    this.handleLogout();
                    break;
                    
                case 'USER_UPDATED':
                    this.currentUser = session.user;
                    break;
                    
                case 'TOKEN_REFRESHED':
                    if (this.storage.setAuthToken) {
                        this.storage.setAuthToken(session.access_token);
                    }
                    break;
            }
        });
    }

    async handleLoginSuccess(user, session) {
        this.isAuthenticated = true;
        this.currentUser = user;
        
        console.log('✅ Usuario autenticado:', user.email);
        
        // Configurar el storage con el token
        if (this.storage.setAuthToken) {
            this.storage.setAuthToken(session.access_token);
        }
        
        // Disparar evento global
        window.dispatchEvent(new CustomEvent('mizu:userLoggedIn', {
            detail: { user }
        }));
        
        // Sincronizar notas del servidor
        await this.syncNotesAfterLogin();
        
        notificationService.success(`¡Bienvenido ${user.email}!`);
    }

    async handleLogout() {
        this.isAuthenticated = false;
        this.currentUser = null;
        
        console.log('🚪 Usuario cerró sesión');
        
        // Disparar evento global
        window.dispatchEvent(new CustomEvent('mizu:userLoggedOut'));
        
        // Limpiar datos locales
        this.cleanupAfterLogout();
        
        notificationService.info('Sesión cerrada correctamente');
    }

    async cleanupAfterLogout() {
        // 1. Limpiar storage
        if (this.storage.clearUserData) {
            this.storage.clearUserData();
        }
        
        // 2. Limpiar notas del manager
        this.notesManager.clearNotes();
        this.notesManager.setCurrentNote(null);
        
        // 3. Limpiar localStorage específico del usuario
        this.clearUserLocalStorage();
        
        // 4. Crear una nota vacía para modo local
        setTimeout(() => {
            this.notesManager.createNote('Nueva Nota Local', '');
            this.notesManager.save();
        }, 500);
    }

    clearUserLocalStorage() {
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
                key.startsWith('mizu_notes_') || 
                key === 'mizu_auth_token' ||
                key === 'mizu_current_user_id'
            )) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        console.log('🧹 localStorage limpiado:', keysToRemove);
    }

    async syncNotesAfterLogin() {
        try {
            notificationService.info('Sincronizando notas...');
            
            // 1. Obtener notas del servidor
            const serverNotes = await this.storage.getNotes();
            
            // 2. Obtener notas locales actuales
            const currentNotes = this.notesManager.getNotes();
            
            // 3. Si hay notas locales, hacer fusión inteligente
            if (currentNotes.size > 0) {
                await this.mergeNotes(serverNotes, currentNotes);
            } else {
                // Usar directamente las notas del servidor
                this.notesManager.clearNotes();
                serverNotes.forEach(note => {
                    this.notesManager.notes.set(note.id, note);
                });
            }
            
            // 4. Actualizar UI
            this.notesManager.notifyUpdate();
            
            // 5. Establecer nota actual
            if (this.notesManager.getNotes().size > 0) {
                const lastEdited = Array.from(this.notesManager.getNotes().values())
                    .sort((a, b) => b.updatedAt - a.updatedAt)[0];
                this.notesManager.setCurrentNote(lastEdited.id);
            }
            
            notificationService.success('Sincronización completada');
            
        } catch (error) {
            console.error('Error en sincronización post-login:', error);
            notificationService.warning('Usando notas locales');
        }
    }

    async mergeNotes(serverNotes, localNotes) {
        const merged = new Map();
        
        // Primero agregar todas las notas del servidor
        serverNotes.forEach((note, id) => {
            merged.set(id, note);
        });
        
        // Luego agregar notas locales que no existen en el servidor
        localNotes.forEach((localNote, localId) => {
            if (!merged.has(localId)) {
                // Nota local nueva - agregar al servidor
                merged.set(localId, localNote);
            } else {
                // Conflicto: usar la versión más reciente
                const serverNote = merged.get(localId);
                if (localNote.updatedAt > serverNote.updatedAt) {
                    merged.set(localId, localNote);
                }
            }
        });
        
        // Actualizar el notesManager con las notas fusionadas
        this.notesManager.clearNotes();
        merged.forEach(note => {
            this.notesManager.notes.set(note.id, note);
        });
        
        console.log(`✅ Fusión completada: ${merged.size} notas`);
    }

    // Métodos públicos para la UI
    async login(email, password) {
        return await this.auth.signIn(email, password);
    }

    async signup(email, password, name) {
        return await this.auth.signUp(email, password, name);
    }

    async loginWithProvider(provider) {
        return await this.auth.signInWithProvider(provider);
    }

    async logout() {
        return await this.auth.signOut();
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isUserAuthenticated() {
        return this.isAuthenticated;
    }
}