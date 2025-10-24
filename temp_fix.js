// Modificar el método initializeStorage en app.js
async initializeStorage() {
    // Primero intentar conectar con el backend
    try {
        this.storage = new ApiStorage('http://localhost:3000/api');
        await this.storage.initialize();
        
        // Verificar conexión
        const isConnected = await this.storage.checkConnection();
        if (isConnected) {
            console.log('✅ Conectado al backend - Usando ApiStorage');
            return;
        }
    } catch (error) {
        console.log('❌ Backend no disponible - Usando LocalStorage:', error.message);
    }
    
    // Fallback a LocalStorage
    this.storage = new LocalStorage();
    console.log('📱 Usando almacenamiento local');
}
