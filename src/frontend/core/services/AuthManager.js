// src/frontend/core/services/AuthManager.js - VERSIÓN CORREGIDA
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
            await this.handleLoginSuccess(sessionResult.user, sessionResult.session);
        }
    }

    setupAuthListeners() {
        // Escuchar cambios de estado de autenticación de Supabase
        this.auth.supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔐 Estado de autenticación cambiado:', event);
            
            switch (event) {
                case 'SIGNED_IN':
                    await this.handleLoginSuccess(session.user, session);
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
        
        // ✅ PRIMERO configurar el storage con el token
        if (this.storage.setAuthToken) {
            this.storage.setAuthToken(session.access_token);
        }
        
        // ✅ ESPERAR a que el storage se inicialice
        await this.storage.initialize();
        
        // ✅ LUEGO sincronizar (NO limpiar primero)
        await this.syncNotesAfterLogin();
        
        // ✅ FINALMENTE disparar eventos
        window.dispatchEvent(new CustomEvent('mizu:userLoggedIn', {
            detail: { user }
        }));
        
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
            
            // 1. Obtener notas del servidor PRIMERO
            const serverNotes = await this.storage.getNotes();
            console.log('📥 Notas del servidor:', serverNotes.size);
            
            // 2. Obtener notas locales ACTUALES (sin limpiar)
            const currentNotes = this.notesManager.getNotes();
            console.log('📱 Notas locales:', currentNotes.size);
            
            // 3. Si NO hay notas locales, usar las del servidor directamente
            if (currentNotes.size === 0) {
                console.log('🔄 Cargando notas del servidor...');
                this.notesManager.clearNotes();
                serverNotes.forEach(note => {
                    this.notesManager.notes.set(note.id, note);
                });
            } else {
                // 4. Si HAY notas locales, hacer fusión INTELIGENTE
                console.log('🔄 Fusionando notas locales con servidor...');
                await this.mergeNotes(serverNotes, currentNotes);
            }
            
            // 5. Guardar el estado fusionado
            await this.notesManager.save();
            
            // 6. Actualizar UI
            this.notesManager.notifyUpdate();
            
            // 7. Establecer nota actual
            if (this.notesManager.getNotes().size > 0) {
                const lastEdited = Array.from(this.notesManager.getNotes().values())
                    .sort((a, b) => b.updatedAt - a.updatedAt)[0];
                this.notesManager.setCurrentNote(lastEdited.id);
            }
            
            console.log('✅ Sincronización completada:', this.notesManager.getNotes().size, 'notas');
            notificationService.success('Sincronización completada');
            
        } catch (error) {
            console.error('❌ Error en sincronización post-login:', error);
            notificationService.warning('Usando notas locales - Error: ' + error.message);
        }
    }

    async mergeNotes(serverNotes, localNotes) {
        const merged = new Map();
        
        console.log('🔄 Iniciando fusión...');
        console.log('📡 Notas del servidor:', serverNotes.size);
        console.log('💾 Notas locales:', localNotes.size);
        
        // Primero agregar todas las notas del servidor
        serverNotes.forEach((note, id) => {
            merged.set(id, note);
        });
        
        console.log('✅ Notas del servidor agregadas:', merged.size);
        
        // Luego agregar notas locales que no existen en el servidor
        localNotes.forEach((localNote, localId) => {
            if (!merged.has(localId)) {
                // Nota local nueva - agregar al servidor
                console.log('➕ Agregando nota local nueva:', localId, localNote.title);
                merged.set(localId, localNote);
            } else {
                // Conflicto: usar la versión más reciente
                const serverNote = merged.get(localId);
                if (localNote.updatedAt > serverNote.updatedAt) {
                    console.log('🔄 Reemplazando nota del servidor con versión local más reciente:', localId);
                    merged.set(localId, localNote);
                } else {
                    console.log('📡 Manteniendo versión del servidor (más reciente):', localId);
                }
            }
        });
        
        // Actualizar el notesManager con las notas fusionadas
        this.notesManager.clearNotes();
        merged.forEach(note => {
            this.notesManager.notes.set(note.id, note);
        });
        
        console.log(`✅ Fusión completada: ${merged.size} notas`);
        return merged;
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