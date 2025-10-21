// src/backend/api/controllers/notes.controller.js
import { NoteModel } from '../../database/models/Note.js';

export class NotesController {
    
    static async getNotes(req, res) {
        try {
            const userId = req.user.id;
            const notes = await NoteModel.findByUser(userId);
            
            res.json({
                success: true,
                data: notes,
                count: notes.length,
                message: notes.length === 0 ? 'No hay notas aún' : 'Notas obtenidas correctamente'
            });
        } catch (error) {
            console.error('Error obteniendo notas:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener notas',
                message: error.message
            });
        }
    }

    static async createNote(req, res) {
        try {
            const userId = req.user.id;
            const { title, content } = req.body;
            
            if (!title && !content) {
                return res.status(400).json({
                    success: false,
                    error: 'Título o contenido requerido'
                });
            }
            
            const note = await NoteModel.create(userId, {
                title: title || 'Nueva Nota',
                content: content || ''
            });
            
            res.status(201).json({
                success: true,
                data: note,
                message: 'Nota creada correctamente'
            });
        } catch (error) {
            console.error('Error creando nota:', error);
            res.status(500).json({
                success: false,
                error: 'Error al crear nota',
                message: error.message
            });
        }
    }

    static async updateNote(req, res) {
        try {
            const userId = req.user.id;
            const noteId = req.params.id;
            const { title, content, version } = req.body;
            
            if (!title && !content) {
                return res.status(400).json({
                    success: false,
                    error: 'Título o contenido requerido para actualizar'
                });
            }
            
            const note = await NoteModel.update(noteId, userId, {
                title,
                content,
                version: version || 1
            });
            
            if (!note) {
                return res.status(404).json({
                    success: false,
                    error: 'Nota no encontrada'
                });
            }
            
            res.json({
                success: true,
                data: note,
                message: 'Nota actualizada correctamente'
            });
        } catch (error) {
            console.error('Error actualizando nota:', error);
            res.status(500).json({
                success: false,
                error: 'Error al actualizar nota',
                message: error.message
            });
        }
    }

    static async deleteNote(req, res) {
        try {
            const userId = req.user.id;
            const noteId = req.params.id;
            
            const note = await NoteModel.softDelete(noteId, userId);
            
            if (!note) {
                return res.status(404).json({
                    success: false,
                    error: 'Nota no encontrada'
                });
            }
            
            res.json({
                success: true,
                message: 'Nota eliminada correctamente',
                data: { id: noteId }
            });
        } catch (error) {
            console.error('Error eliminando nota:', error);
            res.status(500).json({
                success: false,
                error: 'Error al eliminar nota',
                message: error.message
            });
        }
    }

    static async getStats(req, res) {
        try {
            const userId = req.user.id;
            const stats = await NoteModel.getStats(userId);
            
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener estadísticas'
            });
        }
    }
}
