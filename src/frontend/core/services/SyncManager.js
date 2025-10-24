// src/frontend/core/services/SyncManager.js - VERSIÓN MEJORADA
export class SyncManager {
    constructor(storage, notesManager) {
        this.storage = storage;
        this.notesManager = notesManager;
        this.syncQueue = new Set();
        this.isSyncing = false;
        this.isOnline = navigator.onLine;
        this.lastSyncTime = 0;
        this.syncInterval = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Escuchar cambios en las notas
        this.notesManager.subscribe('noteUpdated', (note) => {
            this.addToSyncQueue(note.id);
        });
        
        this.notesManager.subscribe('noteCreated', (note) => {
            this.addToSyncQueue(note.id);
        });

        // Escuchar cambios de conexión
        window.addEventListener('online', () => this.handleConnectionChange(true));
        window.addEventListener('offline', () => this.handleConnectionChange(false));

        // Escuchar eventos de autenticación
        window.addEventListener('mizu:userLoggedIn', () => {
            this.trySync(); // Sincronizar automáticamente al login
        });

        window.addEventListener('mizu:authError', () => {
            this.handleAuthError();
        });
    }

    addToSyncQueue(noteId) {
        this.syncQueue.add(noteId);
        if (this.isOnline) {
            this.trySync();
        }
    }

    async trySync() {
        if (!this.isOnline || this.syncQueue.size === 0 || this.isSyncing) {
            return;
        }

        this.isSyncing = true;
        this.notesManager.emit('syncStatusChanged', 'syncing');

        try {
            await this.performSync();
            this.lastSyncTime = Date.now();
            this.syncQueue.clear();
            this.notesManager.emit('syncStatusChanged', 'success');
        } catch (error) {
            console.error('Sync error:', error);
            this.notesManager.emit('syncStatusChanged', 'error');
            this.handleSyncError(error);
        } finally {
            this.isSyncing = false;
        }
    }

    // NUEVO: Sincronización inteligente con resolución de conflictos
    async performSync() {
        const notesMap = this.notesManager.getNotes();
        
        if (notesMap.size > 0) {
            try {
                // Intentar sincronizar con el servidor
                await this.storage.saveNotes(notesMap);
                console.log('✅ Notas sincronizadas con el backend');
                
                // Actualizar timestamps de sincronización
                notesMap.forEach(note => {
                    note.lastSynced = Date.now();
                });
                
            } catch (error) {
                // En caso de error, mantener versión local
                console.warn('⚠️ Sincronización falló, manteniendo versión local');
                this.handleSyncError(error, notesMap);
            }
        }
    }

    // NUEVO: Manejar errores de sincronización
    handleSyncError(error, notesMap = null) {
        if (error.message.includes('409') || error.message.includes('conflict')) {
            // Conflicto de versión - necesitaría resolución manual
            console.warn('Conflicto de versión detectado');
            this.notesManager.emit('syncConflict', { 
                error, 
                notes: notesMap ? Array.from(notesMap.values()) : [] 
            });
        } else if (error.message.includes('401') || error.message.includes('token')) {
            // Error de autenticación - cambiar a modo local
            console.warn('Error de autenticación, cambiando a modo local');
            window.dispatchEvent(new CustomEvent('mizu:authError'));
        }
    }

    // NUEVO: Manejar error de autenticación
    handleAuthError() {
        this.stopSyncInterval();
        this.notesManager.emit('syncStatusChanged', 'offline');
    }

    handleConnectionChange(online) {
        this.isOnline = online;
        this.notesManager.emit('onlineStatusChanged', online);
        
        if (online && this.syncQueue.size > 0) {
            this.trySync();
        }
    }

    startSyncInterval(interval = 30000) {
        this.stopSyncInterval();
        this.syncInterval = setInterval(() => {
            if (this.isOnline && this.syncQueue.size > 0) {
                this.trySync();
            }
        }, interval);
    }

    stopSyncInterval() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    // NUEVO: Forzar sincronización completa
    async forceFullSync() {
        if (!this.isOnline) {
            this.showMessage('No hay conexión para sincronizar');
            return;
        }

        this.notesManager.emit('syncStatusChanged', 'syncing');
        
        try {
            // Recargar notas del servidor
            const serverNotes = await this.storage.getNotes();
            
            // Reemplazar notas locales
            this.notesManager.clearNotes();
            serverNotes.forEach(note => {
                this.notesManager.notes.set(note.id, note);
            });
            
            this.notesManager.notifyUpdate();
            this.lastSyncTime = Date.now();
            
            this.notesManager.emit('syncStatusChanged', 'success');
            this.showMessage('Sincronización completa exitosa');
            
        } catch (error) {
            console.error('Error en sincronización completa:', error);
            this.notesManager.emit('syncStatusChanged', 'error');
            this.showError('Error en sincronización completa');
        }
    }

    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            isSyncing: this.isSyncing,
            queueSize: this.syncQueue.size,
            lastSync: this.lastSyncTime
        };
    }

    // Métodos auxiliares para mostrar mensajes
    showMessage(message) {
        if (window.app && window.app.showMessage) {
            window.app.showMessage(message);
        } else {
            console.log('📢', message);
        }
    }

    showError(message) {
        if (window.app && window.app.showError) {
            window.app.showError(message);
        } else {
            console.error('❌', message);
        }
    }
}