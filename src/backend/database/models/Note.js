// src/backend/database/models/Note.js
import { db } from '../connection.js';

export class NoteModel {
    static async create(userId, noteData) {
        const { title = '', content = '', version = 1 } = noteData;
        
        const result = await db.query(
            \INSERT INTO notes (user_id, title, content, version) 
             VALUES (\, \, \, \) 
             RETURNING *\,
            [userId, title, content, version]
        );
        return result.rows[0];
    }

    static async findByUser(userId, includeDeleted = false) {
        let query = 'SELECT * FROM notes WHERE user_id = \';
        const params = [userId];
        
        if (!includeDeleted) {
            query += ' AND is_deleted = false';
        }
        
        query += ' ORDER BY updated_at DESC';
        
        const result = await db.query(query, params);
        return result.rows;
    }

    static async findById(id, userId) {
        const result = await db.query(
            'SELECT * FROM notes WHERE id = \ AND user_id = \ AND is_deleted = false',
            [id, userId]
        );
        return result.rows[0];
    }

    static async update(id, userId, updates) {
        const { title, content, version } = updates;
        
        const result = await db.query(
            \UPDATE notes 
             SET title = \, content = \, version = \, updated_at = NOW()
             WHERE id = \ AND user_id = \ AND is_deleted = false
             RETURNING *\,
            [title, content, version, id, userId]
        );
        return result.rows[0];
    }

    static async softDelete(id, userId) {
        const result = await db.query(
            \UPDATE notes 
             SET is_deleted = true, updated_at = NOW()
             WHERE id = \ AND user_id = \
             RETURNING *\,
            [id, userId]
        );
        return result.rows[0];
    }

    static async syncUserNotes(userId, notes) {
        console.log('🔄 Sincronizando notas para usuario:', userId);
        
        // Por ahora, solo log la operación
        // Implementación completa en siguiente iteración
        return {
            synced: notes.length,
            timestamp: new Date().toISOString()
        };
    }

    static async getStats(userId) {
        const result = await db.query(
            \SELECT 
                COUNT(*) as total_notes,
                COUNT(*) FILTER (WHERE is_deleted = true) as deleted_notes,
                SUM(LENGTH(content)) as total_chars
             FROM notes 
             WHERE user_id = \\,
            [userId]
        );
        return result.rows[0];
    }
}
