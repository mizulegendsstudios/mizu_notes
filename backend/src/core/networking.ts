// api/src/core/networking.ts - Motor de WebSocket binario para KATANA v7
// ÚLTIMO CAMBIO: 2025-10-28 - Motor real-time con mensajes binarios para baja latencia
// IMPORTANCIA: CRÍTICO - Maneja todas las conexiones WebSocket y mensajes binarios

import { WebSocket } from 'ws';
import { OpCode, encodeMessage, decodeMessage } from '@shared/messages/ws';
import { verifyJWT } from '../plugins/supabase.js';
import { getUserNotes, createNote } from '../services/notes.js';

// Mapa de conexiones activas (userId -> WebSocket)
// ÚLTIMO CAMBIO: 2025-10-28 - Añadido para seguimiento de conexiones activas
// IMPORTANCIA: ALTA - Permite enviar mensajes a usuarios específicos y gestionar desconexiones
const connections = new Map<string, WebSocket>();

export async function handleWS(ws: WebSocket) {
  let userId: string | null = null;
  let isAuthenticated = false;

  console.log('🔗 Nueva conexión WebSocket');

  ws.on('message', async (data) => {
    try {
      const message = decodeMessage(data);
      console.log('📨 Mensaje recibido:', { op: message.op, userId });

      switch (message.op) {
        case OpCode.AUTH:
          await handleAuth(message.data, ws);
          break;

        case OpCode.NOTE_LIST:
          if (!isAuthenticated) {
            ws.send(encodeMessage(OpCode.ERROR, { error: 'No autenticado' }));
            break;
          }
          await handleNoteList(ws, userId!);
          break;

        case OpCode.NOTE_CREATE:
          if (!isAuthenticated) {
            ws.send(encodeMessage(OpCode.ERROR, { error: 'No autenticado' }));
            break;
          }
          await handleNoteCreate(message.data, ws, userId!);
          break;

        default:
          console.warn('⚠️ Operación desconocida:', message.op);
          ws.send(encodeMessage(OpCode.ERROR, { error: 'Operación no válida' }));
      }
    } catch (error) {
      console.error('❌ Error procesando mensaje:', error);
      ws.send(encodeMessage(OpCode.ERROR, { error: 'Error interno' }));
    }
  });

  ws.on('close', () => {
    if (userId) {
      connections.delete(userId);
      console.log('🔌 Conexión cerrada para usuario:', userId);
    }
  });

  ws.on('error', (error) => {
    console.error('❌ Error WebSocket:', error);
  });

  // Handlers específicos
  async function handleAuth(data: ArrayBuffer | undefined, ws: WebSocket) {
    if (!data) {
      ws.send(encodeMessage(OpCode.ERROR, { error: 'Datos de auth faltantes' }));
      return;
    }

    const token = Buffer.from(data).toString('utf8');
    console.log('🔑 Intentando autenticar...');

    const user = await verifyJWT(token);
    
    if (!user) {
      ws.send(encodeMessage(OpCode.ERROR, { error: 'Token inválido' }));
      ws.close(1008, 'Autenticación fallida');
      return;
    }

    userId = user.id;
    isAuthenticated = true;
    connections.set(userId, ws);
    
    console.log('✅ Usuario autenticado:', userId);
    ws.send(encodeMessage(OpCode.ACK, { message: 'Autenticado correctamente' }));
  }

  async function handleNoteList(ws: WebSocket, userId: string) {
    console.log('📋 Obteniendo notas para usuario:', userId);
    
    try {
      const notes = await getUserNotes(userId);
      ws.send(encodeMessage(OpCode.NOTE_LIST, notes));
      console.log(`✅ Enviadas ${notes.length} notas`);
    } catch (error) {
      console.error('❌ Error obteniendo notas:', error);
      ws.send(encodeMessage(OpCode.ERROR, { error: 'Error obteniendo notas' }));
    }
  }

  async function handleNoteCreate(data: ArrayBuffer | undefined, ws: WebSocket, userId: string) {
    if (!data) {
      ws.send(encodeMessage(OpCode.ERROR, { error: 'Datos de nota faltantes' }));
      return;
    }

    try {
      const { title, content } = JSON.parse(Buffer.from(data).toString('utf8'));
      console.log('📝 Creando nota:', { title, userId });

      const note = await createNote(userId, title, content);
      ws.send(encodeMessage(OpCode.NOTE_CREATE, note));
      console.log('✅ Nota creada:', note.id);
      
    } catch (error) {
      console.error('❌ Error creando nota:', error);
      ws.send(encodeMessage(OpCode.ERROR, { error: 'Error creando nota' }));
    }
  }
}