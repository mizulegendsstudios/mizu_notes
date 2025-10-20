// core/SyncManager.js
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
        } finally {
            this.isSyncing = false;
        }
    }

    async performSync() {
        // Simular sincronización con servidor
        // En una implementación real, aquí se conectaría con la API
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        // Simular fallo aleatorio (10% de probabilidad)
        if (Math.random() < 0.1) {
            throw new Error('Error de servidor simulado');
        }

        // Marcar notas como sincronizadas
        this.syncQueue.forEach(noteId => {
            const note = this.notesManager.getNote(noteId);
            if (note) {
                note.lastSynced = Date.now();
            }
        });
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

    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            isSyncing: this.isSyncing,
            queueSize: this.syncQueue.size,
            lastSync: this.lastSyncTime
        };
    }
}