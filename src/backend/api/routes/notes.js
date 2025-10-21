// src/backend/api/routes/notes.js
import { Router } from 'express';
import { NotesController } from '../controllers/notes.controller.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/', NotesController.getNotes);
router.post('/', NotesController.createNote);
router.put('/:id', NotesController.updateNote);
router.delete('/:id', NotesController.deleteNote);
router.get('/stats', NotesController.getStats);

export default router;
