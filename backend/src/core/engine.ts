// api/src/core/engine.ts - Motor de sincronización real-time para KATANA v7
// ÚLTIMO CAMBIO: 2025-10-28 - Separado de networking.ts, ahora es motor de sincronización
// IMPORTANCIA: CRÍTICO - Gestiona el estado de la aplicación y sincronización en tiempo real

import { WebSocket } from 'ws';
import { OpCode, encodeMessage } from '@shared/messages/ws';
import { getUserNotes, updateNote, deleteNote } from '../services/notes.js';
import { connections } from './networking.js';

// Cola de sincronización para procesar cambios
// ÚLTIMO CAMBIO: 2025-10-28 - Añadida cola para procesar cambios de forma ordenada
// IMPORTANCIA: ALTA - Evita race conditions y asegura orden de operaciones
interface SyncOperation {
  type: 'UPDATE' | 'DELETE';
  userId: string;
  noteId: string;
  data?: any;
  timestamp: number;
}

const syncQueue: SyncOperation[] = [];
let isProcessingQueue = false;

export class GameEngine {
  private gameLoopInterval: NodeJS.Timeout | null = null;
  private tickRate: number = 1000 / 30; // 30 ticks por segundo (suficiente para notas)

  constructor() {
    // El motor no necesita el servicio de notas directamente
    // Lo obtiene cuando lo necesita para evitar acoplamiento
  }

  // Inicia el motor de sincronización
  // ÚLTIMO CAMBIO: 2025-10-28 - Implementado bucle de sincronización
  // IMPORTANCIA: CRÍTICO - Inicia el procesamiento de cambios y sincronización
  public start(): void {
    if (this.gameLoopInterval) {
      console.warn('⚠️ El motor de sincronización ya está en ejecución');
      return;
    }

    console.log('🚀 Iniciando motor de sincronización real-time');
    this.gameLoopInterval = setInterval(() => this.gameLoop(), this.tickRate);
  }

  // Detiene el motor de sincronización
  // ÚLTIMO CAMBIO: 2025-10-28 - Implementada detención limpia
  // IMPORTANCIA: ALTA - Detiene el procesamiento y libera recursos
  public stop(): void {
    if (!this.gameLoopInterval) {
      console.warn('⚠️ El motor de sincronización no está en ejecución');
      return;
    }

    console.log('🛑 Deteniendo motor de sincronización');
    clearInterval(this.gameLoopInterval);
    this.gameLoopInterval = null;
  }

  // Bucle principal del motor
  // ÚLTIMO CAMBIO: 2025-10-28 - Implementado procesamiento de cola de sincronización
  // IMPORTANCIA: CRÍTICO - Procesa cambios pendientes y mantiene sincronizados los clientes
  private gameLoop(): void {
    // Procesar cola de sincronización
    if (!isProcessingQueue && syncQueue.length > 0) {
      this.processSyncQueue();
    }

    // Aquí podríamos agregar:
    // - Detección de cambios en la base de datos
    // - Limpieza de conexiones inactivas
    // - Estadísticas de rendimiento
  }

  // Procesa la cola de sincronización
  // ÚLTIMO CAMBIO: 2025-10-28 - Implementado procesamiento ordenado de cambios
  // IMPORTANCIA: ALTA - Asegura que los cambios se procesen en orden y sin conflictos
  private async processSyncQueue(): Promise<void> {
    if (isProcessingQueue) return;
    
    isProcessingQueue = true;
    
    try {
      while (syncQueue.length > 0) {
        const operation = syncQueue.shift();
        if (!operation) continue;

        await this.processSyncOperation(operation);
      }
    } catch (error) {
      console.error('❌ Error procesando cola de sincronización:', error);
    } finally {
      isProcessingQueue = false;
    }
  }

  // Procesa una operación de sincronización individual
  // ÚLTIMO CAMBIO: 2025-10-28 - Implementado procesamiento de operaciones
  // IMPORTANCIA: ALTA - Ejecuta la operación y notifica a los clientes
  private async processSyncOperation(operation: SyncOperation): Promise<void> {
    const { type, userId, noteId, data } = operation;

    try {
      switch (type) {
        case 'UPDATE':
          await this.handleNoteUpdate(userId, noteId, data);
          break;
        case 'DELETE':
          await this.handleNoteDelete(userId, noteId);
          break;
      }
    } catch (error) {
      console.error(`❌ Error en operación ${type} para nota ${noteId}:`, error);
    }
  }

  // Maneja la actualización de una nota
  // ÚLTIMO CAMBIO: 2025-10-28 - Implementada actualización con broadcast
  // IMPORTANCIA: ALTA - Actualiza la nota y notifica a todos los clientes del usuario
  private async handleNoteUpdate(userId: string, noteId: string, data: any): Promise<void> {
    try {
      const updatedNote = await updateNote(noteId, userId, data);
      
      // Enviar actualización a todos los clientes del usuario
      const noteData = JSON.stringify(updatedNote);
      const buffer = Buffer.from(noteData);
      
      this.broadcastToUser(userId, OpCode.NOTE_UPDATE, buffer.buffer);
      console.log(`✅ Nota ${noteId} actualizada y sincronizada`);
    } catch (error) {
      console.error('❌ Error actualizando nota:', error);
    }
  }

  // Maneja la eliminación de una nota
  // ÚLTIMO CAMBIO: 2025-10-28 - Implementada eliminación con broadcast
  // IMPORTANCIA: ALTA - Elimina la nota y notifica a todos los clientes del usuario
  private async handleNoteDelete(userId: string, noteId: string): Promise<void> {
    try {
      const deleted = await deleteNote(noteId, userId);
      
      if (deleted) {
        const deleteData = JSON.stringify({ noteId });
        const buffer = Buffer.from(deleteData);
        
        this.broadcastToUser(userId, OpCode.NOTE_DELETE, buffer.buffer);
        console.log(`✅ Nota ${noteId} eliminada y sincronizada`);
      }
    } catch (error) {
      console.error('❌ Error eliminando nota:', error);
    }
  }

  // Agrega una operación a la cola de sincronización
  // ÚLTIMO CAMBIO: 2025-10-28 - Implementada cola para operaciones asíncronas
  // IMPORTANCIA: ALTA - Permite procesar operaciones de forma asíncrona y ordenada
  public queueSyncOperation(operation: SyncOperation): void {
    syncQueue.push(operation);
    console.log(`📝 Operación encolada: ${operation.type} para nota ${operation.noteId}`);
  }

  // Envía un mensaje a todos los clientes de un usuario
  // ÚLTIMO CAMBIO: 2025-10-28 - Implementado broadcast específico por usuario
  // IMPORTANCIA: ALTA - Mantiene sincronizados todos los clientes del mismo usuario
  public broadcastToUser(userId: string, opCode: OpCode, data?: ArrayBuffer): void {
    const ws = connections.get(userId);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      const message = encodeMessage(opCode, data);
      ws.send(message);
    }
  }

  // Fuerza la recarga de notas para un usuario
  // ÚLTIMO CAMBIO: 2025-10-28 - Implementada recarga forzada
  // IMPORTANCIA: MEDIA - Útil para sincronizar después de cambios externos
  public async refreshUserNotes(userId: string): Promise<void> {
    try {
      const notes = await getUserNotes(userId);
      const notesData = JSON.stringify(notes);
      const buffer = Buffer.from(notesData);
      
      this.broadcastToUser(userId, OpCode.NOTE_LIST, buffer.buffer);
      console.log(`🔄 Notas recargadas para usuario ${userId}`);
    } catch (error) {
      console.error('❌ Error recargando notas:', error);
    }
  }
}

// Instancia global del motor
// ÚLTIMO CAMBIO: 2025-10-28 - Creada instancia global para acceso desde otros módulos
// IMPORTANCIA: ALTA - Permite que el motor sea accesible desde todo el backend
export const gameEngine = new GameEngine();