// src/backend/api/routes/notes.js - VERSIÓN CORREGIDA
const express = require('express');
const router = express.Router();

const notesController = require('../controllers/notes.controller');
const authMiddleware = require('../../middleware/auth');

// 🔧 MANEJAR OPTIONS EXPLÍCITAMENTE PARA /api/notes
router.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).send();
});

// Rutas protegidas
router.get('/', authMiddleware, notesController.getNotes);
router.post('/', authMiddleware, notesController.createNote);
router.put('/:id', authMiddleware, notesController.updateNote);
router.delete('/:id', authMiddleware, notesController.deleteNote);
router.get('/stats', authMiddleware, notesController.getStats);

module.exports = router;