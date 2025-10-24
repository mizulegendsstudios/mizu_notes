// src/backend/middleware/auth.js - VERSIÓN PERMISIVA TEMPORAL
const { verifyToken } = require('../lib/supabase.js');
const { UserModel } = require('../database/models/User.js');

async function authMiddleware(req, res, next) {
    try {
        // 🔧 PERMITIR TODAS LAS PETICIONES OPTIONS
        if (req.method === 'OPTIONS') {
            console.log('✅ Permitiendo OPTIONS para CORS');
            return res.status(200).send();
        }

        // 🔧 EN PRODUCCIÓN: Permitir acceso sin token temporalmente
        if (process.env.NODE_ENV === 'production') {
            console.log('🔧 Modo producción: Verificando token...');
            
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                console.log('⚠️ No hay token, pero permitiendo acceso en modo desarrollo');
                req.user = {
                    id: 'production-user-123',
                    supabase_uid: 'prod-user-123', 
                    email: 'user@mizunotes.com',
                    username: 'production-user'
                };
                return next();
            }

            const token = authHeader.substring(7);
            
            if (!token) {
                console.log('⚠️ Token vacío, pero permitiendo acceso');
                req.user = {
                    id: 'production-user-123',
                    supabase_uid: 'prod-user-123',
                    email: 'user@mizunotes.com',
                    username: 'production-user'
                };
                return next();
            }

            // Intentar verificar el token
            try {
                const user = await verifyToken(token);
                
                if (user) {
                    console.log('✅ Token válido para:', user.email);
                    
                    let dbUser = await UserModel.findBySupabaseUid(user.id);
                    if (!dbUser) {
                        dbUser = await UserModel.create(
                            user.id, 
                            user.email,
                            user.user_metadata?.username || user.email.split('@')[0]
                        );
                    }

                    req.user = {
                        id: dbUser.id,
                        supabase_uid: user.id,
                        email: user.email,
                        username: dbUser.username
                    };
                } else {
                    console.log('⚠️ Token inválido, pero permitiendo acceso');
                    req.user = {
                        id: 'production-user-123',
                        supabase_uid: 'prod-user-123',
                        email: 'user@mizunotes.com',
                        username: 'production-user'
                    };
                }
            } catch (tokenError) {
                console.log('⚠️ Error verificando token, pero permitiendo acceso:', tokenError.message);
                req.user = {
                    id: 'production-user-123',
                    supabase_uid: 'prod-user-123',
                    email: 'user@mizunotes.com',
                    username: 'production-user'
                };
            }
        } else {
            // En desarrollo: usuario por defecto
            console.log('🔧 Modo desarrollo: Usuario por defecto');
            req.user = {
                id: 'dev-user-123',
                supabase_uid: 'dev-user-123',
                email: 'dev@mizunotes.com',
                username: 'developer'
            };
        }

        next();
    } catch (error) {
        console.error('❌ Error crítico en auth middleware:', error);
        // En caso de error crítico, permitir acceso igualmente
        req.user = {
            id: 'fallback-user-123',
            supabase_uid: 'fallback-user-123',
            email: 'user@mizunotes.com',
            username: 'user'
        };
        next();
    }
}

module.exports = authMiddleware;