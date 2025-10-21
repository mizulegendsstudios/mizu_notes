// src/backend/api/routes/index.js
import notesRoutes from './notes.js';
import authRoutes from './auth.js';

export function setupRoutes(app) {
    app.use('/api/notes', notesRoutes);
    app.use('/api/auth', authRoutes);
    
    console.log('✅ Rutas de API configuradas: /api/notes, /api/auth');
}
