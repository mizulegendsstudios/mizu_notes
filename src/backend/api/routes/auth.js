// src/backend/api/routes/auth.js
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../../middleware/auth.js';

const router = Router();

// Rutas públicas
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/test-user', AuthController.createTestUser); // Solo desarrollo

// Rutas protegidas
router.post('/logout', authMiddleware, AuthController.logout);
router.get('/profile', authMiddleware, AuthController.getProfile);
router.put('/profile', authMiddleware, AuthController.updateProfile);

export default router;
