// src/backend/api/routes/notes.js - Rutas para la gestión de notas
// ÚLTIMO CAMBIO: 2025-10-28 - Fusión de Soluciones - Aplica middleware de autenticación global y estructura clara.
//                - Se asegura que todas las rutas bajo /api/notes requieran autenticación.
// IMPORTANCIA: Compartido para Express (definición de rutas), Node.js (lógica del backend),
//              Supabase/PostgreSQL (integración con base de datos a través de controllers).

const express = require('express');
const router = express.Router();

// Importar controladores específicos para notas
// IMPORTANCIA: Vital para la lógica de negocio (controllers).
const notesController = require('../controllers/notes.controller');

// Importar middleware de autenticación
// NOTA: Este middleware ahora se aplica globalmente en server.js para /api/notes,
// por lo tanto, NO se repite aquí en cada ruta individual.
// const authMiddleware = require('../../middleware/auth'); // <-- Ya no se necesita aquí

// --- RUTAS PARA /api/notes ---
// IMPORTANCIA: Vital para Express (definición de endpoints API).

// GET /api/notes - Obtener todas las notas del usuario autenticado
// Requiere autenticación (verificado en server.js).
router.get('/', /* authMiddleware, */ notesController.getNotes); // authMiddleware ya no es necesario aquí

// POST /api/notes - Crear una nueva nota
// Requiere autenticación (verificado en server.js).
router.post('/', /* authMiddleware, */ notesController.createNote); // authMiddleware ya no es necesario aquí

// GET /api/notes/stats - Obtener estadísticas de notas del usuario autenticado
// Requiere autenticación (verificado en server.js).
router.get('/stats', /* authMiddleware, */ notesController.getStats); // authMiddleware ya no es necesario aquí

// Rutas dinámicas (requieren ID)
// PUT /api/notes/:id - Actualizar una nota específica
// Requiere autenticación (verificado en server.js).
router.put('/:id', /* authMiddleware, */ notesController.updateNote); // authMiddleware ya no es necesario aquí

// DELETE /api/notes/:id - Eliminar una nota específica
// Requiere autenticación (verificado en server.js).
router.delete('/:id', /* authMiddleware, */ notesController.deleteNote); // authMiddleware ya no es necesario aquí

// --- MANEJO DE OPTIONS (Preflight) ---
// Si bien CORS se maneja en server.js, Express puede responder OPTIONS automáticamente
// si no se define una ruta específica para OPTIONS. La inclusión aquí es opcional
// si se manejan headers específicos a nivel de ruta, pero no es común.
// Dado que CORS se maneja globalmente, no es necesario definir OPTIONS aquí.

module.exports = router; // Exportar el router para usarlo en server.js