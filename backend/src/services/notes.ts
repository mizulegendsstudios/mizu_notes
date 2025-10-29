// api/src/services/notes.ts - Servicio de notas con Redis + PostgreSQL
// ÚLTIMO CAMBIO: 2025-10-28 - KATANA v7 - Cache Redis + persistencia Neon
// IMPORTANCIA: CRÍTICO - Lógica de negocio con cacheo en memoria para baja latencia

import { db } from '../db/client.js';
import { notes } from '../db/schema.js';
import { redis } from '../plugins/redis.js';
import { eq } from 'drizzle-orm';
import type { Note } from '@shared/types/Note';

// TTL de cache en segundos (1 minuto)
const CACHE_TTL = 60;

/**
 * Obtiene notas de un usuario con cache Redis
 * @param userId - ID del usuario autenticado
 * @returns Array de notas
 */
export async function getUserNotes(userId: string): Promise<Note[]> {
  const cacheKey = `notes:${userId}`;
  
  try {
    // Intentar obtener del cache
    const cached = await redis.get<Note[]>(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit para usuario ${userId}`);
      return cached;
    }
  } catch (error) {
    console.warn('⚠️ Error leyendo cache:', error);
  }

  console.log(`🔍 Buscando notas en base de datos para usuario ${userId}`);
  
  // Obtener de PostgreSQL
  const userNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(notes.updatedAt);

  console.log(`📋 Encontradas ${userNotes.length} notas en DB`);

  // Guardar en cache con TTL
  try {
    await redis.set(cacheKey, userNotes, { ex: CACHE_TTL });
    console.log(`💾 Guardadas en cache por ${CACHE_TTL}s`);
  } catch (error) {
    console.warn('⚠️ Error guardando en cache:', error);
  }

  return userNotes;
}

/**
 * Crea una nueva nota
 * @param userId - ID del usuario autenticado
 * @param title - Título de la nota
 * @param content - Contenido de la nota
 * @returns La nota creada
 */
export async function createNote(userId: string, title: string, content: string): Promise<Note> {
  const note: Note = {
    id: crypto.randomUUID(),
    userId,
    title: title.trim(),
    content: content.trim(),
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  };

  console.log('📝 Creando nota:', { title, userId });

  try {
    // Insertar en PostgreSQL
    await db.insert(notes).values(note);
    console.log('✅ Nota guardada en DB:', note.id);

    // Invalidar cache del usuario
    await redis.del(`notes:${userId}`);
    console.log('🗑️ Cache invalidado para usuario:', userId);

    return note;
  } catch (error) {
    console.error('❌ Error creando nota:', error);
    throw new Error('Error al crear la nota');
  }
}

/**
 * Actualiza una nota existente
 * @param noteId - ID de la nota
 * @param userId - ID del usuario (para seguridad)
 * @param updates - Campos a actualizar
 * @returns La nota actualizada
 */
export async function updateNote(
  noteId: string,
  userId: string,
  updates: Partial<Pick<Note, 'title' | 'content'>>
): Promise<Note> {
  console.log('✏️ Actualizando nota:', noteId);

  try {
    const result = await db
      .update(notes)
      .set({
        ...updates,
        updatedAt: new Date(),
        version: notes.version + 1
      })
      .where(eq(notes.id, noteId) && eq(notes.userId, userId))
      .returning();

    if (result.length === 0) {
      throw new Error('Nota no encontrada o no pertenece al usuario');
    }

    const updatedNote = result[0];
    console.log('✅ Nota actualizada:', updatedNote.id);

    // Invalidar cache
    await redis.del(`notes:${userId}`);
    return updatedNote;
  } catch (error) {
    console.error('❌ Error actualizando nota:', error);
    throw error;
  }
}

/**
 * Elimina una nota (soft delete)
 * @param noteId - ID de la nota
 * @param userId - ID del usuario (para seguridad)
 * @returns true si se eliminó correctamente
 */
export async function deleteNote(noteId: string, userId: string): Promise<boolean> {
  console.log('🗑️ Eliminando nota:', noteId);

  try {
    const result = await db
      .delete(notes)
      .where(eq(notes.id, noteId) && eq(notes.userId, userId))
      .returning({ deletedId: notes.id });

    const deleted = result.length > 0;
    
    if (deleted) {
      console.log('✅ Nota eliminada:', noteId);
      await redis.del(`notes:${userId}`);
    } else {
      console.log('⚠️ Nota no encontrada o no pertenece al usuario:', noteId);
    }

    return deleted;
  } catch (error) {
    console.error('❌ Error eliminando nota:', error);
    throw error;
  }
}