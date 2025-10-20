// En app.js - actualizar el método initializeStorage
async initializeStorage() {
    // Por defecto usar LocalStorage
    this.storage = new LocalStorage();
    
    // Para usar API storage cuando esté disponible
    // this.storage = new ApiStorage('https://tu-api.com');
    // await this.storage.initialize();
}

// Y en initializeManagers
async initializeManagers() {
    this.notesManager = new NotesManager(this.storage);
    this.syncManager = new SyncManager(this.storage, this.notesManager);
    
    // Si estás usando ApiStorage, inicialízalo
    if (this.storage.initialize) {
        await this.storage.initialize();
    }
}