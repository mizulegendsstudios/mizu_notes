// src/backend/api/routes/notes.js - VERSIÓN CORREGIDA

const express = require('express');
const router = express.Router();

// Importar el controlador y el middleware (usando CommonJS)
const notesController = require('../controllers/notes.controller');
const authMiddleware = require('../../middleware/auth');

// ⚡️ LA SOLUCIÓN CLAVE:
// Aplicar el middleware de autenticación SÓLO a las rutas que lo necesitan.
// La petición OPTIONS (preflight de CORS) no llegará a estas rutas,
// por lo que no será bloqueada por el middleware de autenticación.

router.get('/', authMiddleware, notesController.getNotes);
router.post('/', authMiddleware, notesController.createNote);
router.put('/:id', authMiddleware, notesController.updateNote);
router.delete('/:id', authMiddleware, notesController.deleteNote);
router.get('/stats', authMiddleware, notesController.getStats);

module.exports = router;