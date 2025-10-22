// src/backend/database/models/User.js - VERSIÓN CORREGIDA
import { db } from '../connection.js';

export class UserModel {
    static async create(supabaseUid, email, username = null) {
        const result = await db.query(
            `INSERT INTO users (supabase_uid, email, username) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [supabaseUid, email, username]
        );
        return result.rows[0];
    }

    static async findBySupabaseUid(supabaseUid) {
        const result = await db.query(
            'SELECT * FROM users WHERE supabase_uid = $1',
            [supabaseUid]
        );
        return result.rows[0];
    }

    static async findById(id) {
        const result = await db.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    static async updateUsername(userId, username) {
        const result = await db.query(
            `UPDATE users 
             SET username = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [username, userId]
        );
        return result.rows[0];
    }
}