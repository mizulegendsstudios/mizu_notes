// src/frontend/core/services/AuthManager.js - VERSIÓN MEJORADA
import { SupabaseAuth } from '../auth/SupabaseClient.js';
import { notificationService } from './NotificationService.js';

export class AuthManager {
    constructor(storage, notesManager) {
        this.auth = new SupabaseAuth();
        this.storage = storage;
        this.notesManager = notesManager;
        this.isAuthenticated = false;
        this.currentUser = null;
        this.isSyncing = false;
        
        this.initialize();
    }

    async initialize() {
        // Verificar sesión existente al cargar la app
        await this.checkExistingSession();
        
        // Escuchar cambios de autenticación de Supabase
        this.setupAuthListeners();
    }

    async checkExistingSession() {
        try {
            const sessionResult = await this.auth.initializeSession();
            if (sessionResult.success && sessionResult.user) {
                await this.handleLoginSuccess(sessionResult.user, sessionResult.session);
            }
        } catch (error) {
            console.error('Error al verificar sesión existente:', error);
            notificationService.error('Error al verificar sesión. Por favor, inicia sesión nuevamente.');
        }
    }

    setupAuthListeners() {
        // Escuchar cambios de estado de autenticación de Supabase
        this.auth.supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔐 Estado de autenticación cambiado:', event);
            
            try {
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
                        await this.handleTokenRefresh(session);
                        break;
                }
            } catch (error) {
                console.error(`Error handling auth event ${event}:`, error);
                notificationService.error('Error en la autenticación. Por favor, recarga la página.');
            }
        });
    }

    async handleLoginSuccess(user, session) {
        try {
            // Indicar que estamos procesando el login
            this.isSyncing = true;
            
            // Actualizar estado de autenticación
            this.isAuthenticated = true;
            this.currentUser = user;
            
            console.log('✅ Usuario autenticado:', user.email);
            
            // 1. GUARDAR TOKEN EN LOCALSTORAGE PRIMERO (para persistencia)
            if (session?.access_token) {
                localStorage.setItem('mizu_auth_token', session.access_token);
                localStorage.setItem('mizu_current_user_id', user.id);
                console.log('🔐 Token guardado en localStorage');
            }
            
            // 2. CONFIGURAR STORAGE CON CREDENCIALES
            if (this.storage.setAuthToken) {
                this.storage.setAuthToken(session.access_token);
            }
            
            if (this.storage.setSupabaseClient) {
                this.storage.setSupabaseClient(this.auth.supabase);
            }
            
            // 3. ESPERAR a que el storage se inicialice completamente
            if (this.storage.initialize) {
                await this.storage.initialize();
            }
            
            // 4. SINCRONIZAR NOTAS (con manejo de errores mejorado)
            await this.syncNotesAfterLogin();
            
            // 5. DISPARAR EVENTOS Y NOTIFICACIONES
            window.dispatchEvent(new CustomEvent('mizu:userLoggedIn', {
                detail: { user }
            }));
            
            notificationService.success(`¡Bienvenido ${user.email}!`);
            
        } catch (error) {
            console.error('Error en handleLoginSuccess:', error);
            notificationService.error('Error al iniciar sesión. Por favor, inténtalo de nuevo.');
            
            // En caso de error, limpiar estado parcial
            this.cleanupPartialLogin();
        } finally {
            this.isSyncing = false;
        }
    }

    async handleTokenRefresh(session) {
        try {
            if (session?.access_token) {
                localStorage.setItem('mizu_auth_token', session.access_token);
                console.log('🔄 Token actualizado en localStorage');
            }
            
            if (this.storage.setAuthToken) {
                this.storage.setAuthToken(session.access_token);
            }
            
            console.log('✅ Token refrescado correctamente');
        } catch (error) {
            console.error('Error al refrescar token:', error);
        }
    }

    async handleLogout() {
        try {
            this.isAuthenticated = false;
            this.currentUser = null;
            
            console.log('🚪 Usuario cerró sesión');
            
            // Disparar evento global
            window.dispatchEvent(new CustomEvent('mizu:userLoggedOut'));
            
            // Limpiar datos locales
            this.cleanupAfterLogout();
            
            notificationService.info('Sesión cerrada correctamente');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            notificationService.error('Error al cerrar sesión. Por favor, recarga la página.');
        }
    }

    cleanupPartialLogin() {
        // Limpiar estado parcial en caso de error durante el login
        this.isAuthenticated = false;
        this.currentUser = null;
        
        // Limpiar tokens
        localStorage.removeItem('mizu_auth_token');
        localStorage.removeItem('mizu_current_user_id');
        
        // Resetear storage
        if (this.storage.clearAuthToken) {
            this.storage.clearAuthToken();
        }
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
        if (this.isSyncing) {
            console.log('⏳ Sincronización ya en progreso, omitiendo...');
            return;
        }
        
        try {
            notificationService.info('Sincronizando notas...');
            
            // 1. Obtener notas del servidor PRIMERO
            const serverNotes = await this.storage.getNotes();
            console.log('📥 Notas del servidor:', serverNotes.size);
            
            // 2. Obtener notas locales ACTUALES (sin limpiar)
            const currentNotes = this.notesManager.getNotes();
            console.log('📱 Notas locales:', currentNotes.size);
            
            // 3. Determinar estrategia de sincronización
            if (currentNotes.size === 0) {
                // Si no hay notas locales, usar las del servidor directamente
                console.log('🔄 Cargando notas del servidor...');
                this.notesManager.clearNotes();
                serverNotes.forEach(note => {
                    this.notesManager.notes.set(note.id, note);
                });
            } else if (serverNotes.size === 0) {
                // Si no hay notas en el servidor, subir las locales
                console.log('📤 Subiendo notas locales al servidor...');
                // Las notas locales ya están en el manager, solo necesitamos guardarlas
                await this.notesManager.save();
            } else {
                // Si hay notas en ambos lados, hacer fusión INTELIGENTE
                console.log('🔄 Fusionando notas locales con servidor...');
                await this.mergeNotes(serverNotes, currentNotes);
            }
            
            // 4. Guardar el estado fusionado
            await this.notesManager.save();
            
            // 5. Actualizar UI
            this.notesManager.notifyUpdate();
            
            // 6. Establecer nota actual
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
            
            // En caso de error, asegurar que las notas locales no se pierdan
            try {
                await this.notesManager.save();
                this.notesManager.notifyUpdate();
            } catch (saveError) {
                console.error('Error crítico al guardar notas locales:', saveError);
                notificationService.error('Error crítico. Tus notas podrían estar en riesgo.');
            }
        }
    }

    async mergeNotes(serverNotes, localNotes) {
        const merged = new Map();
        const conflicts = [];
        
        console.log('🔄 Iniciando fusión...');
        console.log('📡 Notas del servidor:', serverNotes.size);
        console.log('💾 Notas locales:', localNotes.size);
        
        // Primero agregar todas las notas del servidor
        serverNotes.forEach((note, id) => {
            merged.set(id, note);
        });
        
        console.log('✅ Notas del servidor agregadas:', merged.size);
        
        // Luego procesar notas locales
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
                    
                    // Registrar conflicto resuelto
                    conflicts.push({
                        id: localId,
                        title: localNote.title,
                        resolution: 'local_wins',
                        localTime: new Date(localNote.updatedAt).toISOString(),
                        serverTime: new Date(serverNote.updatedAt).toISOString()
                    });
                } else {
                    console.log('📡 Manteniendo versión del servidor (más reciente):', localId);
                    
                    // Registrar conflicto resuelto
                    conflicts.push({
                        id: localId,
                        title: localNote.title,
                        resolution: 'server_wins',
                        localTime: new Date(localNote.updatedAt).toISOString(),
                        serverTime: new Date(serverNote.updatedAt).toISOString()
                    });
                }
            }
        });
        
        // Actualizar el notesManager con las notas fusionadas
        this.notesManager.clearNotes();
        merged.forEach(note => {
            this.notesManager.notes.set(note.id, note);
        });
        
        // Notificar sobre conflictos resueltos si hay alguno
        if (conflicts.length > 0) {
            console.log('⚠️ Conflictos resueltos:', conflicts);
            notificationService.info(`Se resolvieron ${conflicts.length} conflictos durante la sincronización.`);
        }
        
        console.log(`✅ Fusión completada: ${merged.size} notas`);
        return merged;
    }

    // Métodos públicos para la UI
    async login(email, password) {
        try {
            const result = await this.auth.signIn(email, password);
            if (!result.success) {
                notificationService.error(result.error || 'Error al iniciar sesión');
            }
            return result;
        } catch (error) {
            console.error('Error en login:', error);
            notificationService.error('Error al iniciar sesión. Por favor, inténtalo de nuevo.');
            return { success: false, error: error.message };
        }
    }

    async signup(email, password, name) {
        try {
            const result = await this.auth.signUp(email, password, name);
            if (!result.success) {
                notificationService.error(result.error || 'Error al crear cuenta');
            }
            return result;
        } catch (error) {
            console.error('Error en signup:', error);
            notificationService.error('Error al crear cuenta. Por favor, inténtalo de nuevo.');
            return { success: false, error: error.message };
        }
    }

    async loginWithProvider(provider) {
        try {
            const result = await this.auth.signInWithProvider(provider);
            if (!result.success) {
                notificationService.error(result.error || `Error al iniciar sesión con ${provider}`);
            }
            return result;
        } catch (error) {
            console.error(`Error en login con ${provider}:`, error);
            notificationService.error(`Error al iniciar sesión con ${provider}. Por favor, inténtalo de nuevo.`);
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            const result = await this.auth.signOut();
            if (!result.success) {
                notificationService.error(result.error || 'Error al cerrar sesión');
            }
            return result;
        } catch (error) {
            console.error('Error en logout:', error);
            notificationService.error('Error al cerrar sesión. Por favor, inténtalo de nuevo.');
            return { success: false, error: error.message };
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    isCurrentlySyncing() {
        return this.isSyncing;
    }
}