// src/backend/database/models/User.js
import { db } from '../connection.js';

export class UserModel {
    static async create(supabaseUid, email, username = null) {
        const result = await db.query(
            \INSERT INTO users (supabase_uid, email, username) 
             VALUES (\, \, \) 
             RETURNING *\,
            [supabaseUid, email, username]
        );
        return result.rows[0];
    }

    static async findBySupabaseUid(supabaseUid) {
        const result = await db.query(
            'SELECT * FROM users WHERE supabase_uid = \',
            [supabaseUid]
        );
        return result.rows[0];
    }

    static async findById(id) {
        const result = await db.query(
            'SELECT * FROM users WHERE id = \',
            [id]
        );
        return result.rows[0];
    }

    static async updateUsername(userId, username) {
        const result = await db.query(
            \UPDATE users 
             SET username = \, updated_at = NOW()
             WHERE id = \
             RETURNING *\,
            [username, userId]
        );
        return result.rows[0];
    }
}
