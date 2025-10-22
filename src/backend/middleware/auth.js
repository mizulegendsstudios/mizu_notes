// src/backend/middleware/auth.js
import { verifyToken } from '../lib/supabase.js';
import { UserModel } from '../database/models/User.js';

export async function authMiddleware(req, res, next) {
    try {
        // En desarrollo, permitir acceso sin token
        if (process.env.NODE_ENV === 'development' && !req.headers.authorization) {
            req.user = {
                id: '11111111-1111-1111-1111-111111111111',
                supabase_uid: 'dev-user-123',
                email: 'dev@mizunotes.com',
                username: 'developer'
            };
            return next();
        }

        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Token de autenticación requerido',
                message: 'Incluye un token Bearer en el header Authorization'
            });
        }

        const token = authHeader.substring(7);
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token vacío'
            });
        }

        // Verificar token con Supabase
        const user = await verifyToken(token);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Token inválido o expirado'
            });
        }

        // Buscar o crear usuario en nuestra base de datos
        let dbUser = await UserModel.findBySupabaseUid(user.id);
        
        if (!dbUser) {
            dbUser = await UserModel.create(
                user.id, 
                user.email,
                user.user_metadata?.username || user.email.split('@')[0]
            );
            console.log(`✅ Nuevo usuario creado: ${dbUser.email}`);
        }

        // Agregar usuario al request
        req.user = {
            id: dbUser.id,
            supabase_uid: user.id,
            email: user.email,
            username: dbUser.username
        };

        next();
    } catch (error) {
        console.error('Error en autenticación:', error);
        res.status(500).json({
            success: false,
            error: 'Error de autenticación',
            message: error.message
        });
    }
}

// Middleware opcional (no bloquea si no hay token)
export async function optionalAuthMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const user = await verifyToken(token);
            
            if (user) {
                let dbUser = await UserModel.findBySupabaseUid(user.id);
                if (!dbUser) {
                    dbUser = await UserModel.create(
                        user.id, 
                        user.email,
                        user.user_metadata?.username
                    );
                }
                req.user = {
                    id: dbUser.id,
                    supabase_uid: user.id,
                    email: user.email,
                    username: dbUser.username
                };
            }
        }
        
        next();
    } catch (error) {
        // En middleware opcional, continuamos incluso con errores
        next();
    }
}



