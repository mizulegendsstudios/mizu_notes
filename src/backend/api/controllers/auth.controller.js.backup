// src/backend/api/controllers/auth.controller.js
import { supabase, createUser } from '../../lib/supabase.js';
import { UserModel } from '../../database/models/User.js';

export class AuthController {
    
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email y contraseña requeridos'
                });
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.toLowerCase().trim(),
                password
            });

            if (error) {
                console.error('Error en login:', error.message);
                return res.status(401).json({
                    success: false,
                    error: 'Credenciales inválidas',
                    message: error.message
                });
            }

            // Asegurar que el usuario existe en nuestra DB
            let dbUser = await UserModel.findBySupabaseUid(data.user.id);
            if (!dbUser) {
                dbUser = await UserModel.create(
                    data.user.id,
                    data.user.email,
                    data.user.user_metadata?.username
                );
            }

            res.json({
                success: true,
                data: {
                    user: {
                        id: dbUser.id,
                        email: dbUser.email,
                        username: dbUser.username
                    },
                    session: {
                        access_token: data.session.access_token,
                        refresh_token: data.session.refresh_token,
                        expires_at: data.session.expires_at
                    }
                },
                message: 'Inicio de sesión exitoso'
            });
            
        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({
                success: false,
                error: 'Error en el servidor',
                message: error.message
            });
        }
    }

    static async register(req, res) {
        try {
            const { email, password, username } = req.body;
            
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email y contraseña requeridos'
                });
            }

            const { data, error } = await supabase.auth.signUp({
                email: email.toLowerCase().trim(),
                password,
                options: {
                    data: {
                        username: username || email.split('@')[0]
                    }
                }
            });

            if (error) {
                console.error('Error en registro:', error.message);
                return res.status(400).json({
                    success: false,
                    error: 'Error en registro',
                    message: error.message
                });
            }

            // Crear usuario en nuestra DB
            if (data.user) {
                await UserModel.create(
                    data.user.id,
                    data.user.email,
                    username || email.split('@')[0]
                );
            }

            res.status(201).json({
                success: true,
                data: {
                    user: data.user,
                    session: data.session
                },
                message: data.user ? 'Usuario registrado exitosamente' : 'Confirma tu email para activar la cuenta'
            });
            
        } catch (error) {
            console.error('Error en registro:', error);
            res.status(500).json({
                success: false,
                error: 'Error en el servidor',
                message: error.message
            });
        }
    }

    static async logout(req, res) {
        try {
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: error.message
                });
            }

            res.json({
                success: true,
                message: 'Sesión cerrada correctamente'
            });
            
        } catch (error) {
            console.error('Error en logout:', error);
            res.status(500).json({
                success: false,
                error: 'Error en el servidor'
            });
        }
    }

    static async getProfile(req, res) {
        try {
            // El usuario ya está autenticado por el middleware
            res.json({
                success: true,
                data: {
                    id: req.user.id,
                    email: req.user.email,
                    username: req.user.username,
                    supabase_uid: req.user.supabase_uid
                }
            });
            
        } catch (error) {
            console.error('Error obteniendo perfil:', error);
            res.status(500).json({
                success: false,
                error: 'Error obteniendo perfil'
            });
        }
    }

    static async updateProfile(req, res) {
        try {
            const { username } = req.body;
            const userId = req.user.id;
            
            if (!username) {
                return res.status(400).json({
                    success: false,
                    error: 'Username requerido'
                });
            }

            const updatedUser = await UserModel.updateUsername(userId, username);
            
            res.json({
                success: true,
                data: updatedUser,
                message: 'Perfil actualizado correctamente'
            });
            
        } catch (error) {
            console.error('Error actualizando perfil:', error);
            res.status(500).json({
                success: false,
                error: 'Error actualizando perfil'
            });
        }
    }

    // Endpoint para desarrollo: crear usuario de prueba
    static async createTestUser(req, res) {
        try {
            if (process.env.NODE_ENV !== 'development') {
                return res.status(403).json({
                    success: false,
                    error: 'Solo disponible en desarrollo'
                });
            }

            const { email = 'test@mizunotes.com', password = 'password123' } = req.body;
            
            const data = await createUser(email, password);
            
            res.json({
                success: true,
                data,
                message: 'Usuario de prueba creado'
            });
            
        } catch (error) {
            console.error('Error creando usuario de prueba:', error);
            res.status(500).json({
                success: false,
                error: 'Error creando usuario de prueba'
            });
        }
    }
}

