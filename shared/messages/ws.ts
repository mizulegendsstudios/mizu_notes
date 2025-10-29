// shared/messages/ws.ts - Protocolo binario para WebSocket real-time
// ÚLTIMO CAMBIO: 2025-10-28 - KATANA v7 - Mensajes binarios para baja latencia
// IMPORTANCIA: CRÍTICO - Define el lenguaje de comunicación cliente-servidor

export enum OpCode {
  // Autenticación y control
  AUTH        = 0x01,  // Handshake con JWT
  PING        = 0x02,  // Keep-alive
  PONG        = 0x03,  // Respuesta keep-alive
  
  // CRUD de notas
  NOTE_CREATE = 0x10,  // Crear nota
  NOTE_UPDATE = 0x11,  // Actualizar nota
  NOTE_DELETE = 0x12,  // Eliminar nota
  NOTE_LIST   = 0x13,  // Listar notas del usuario
  
  // Control de flujo
  ERROR       = 0x20,  // Error del servidor
  ACK         = 0x21,  // Confirmación de recepción
}

// Estructura base para mensajes WebSocket
export interface WSMessage {
  op: OpCode;           // Código de operación (1 byte)
  data?: ArrayBuffer;   // Datos binarios adicionales
}

// Helpers para codificar/decodificar mensajes binarios
export function encodeMessage(op: OpCode, data?: ArrayBuffer): ArrayBuffer {
  if (!data) {
    const buf = new ArrayBuffer(1);
    const view = new Uint8Array(buf);
    view[0] = op;
    return buf;
  }
  
  const buf = new ArrayBuffer(1 + data.byteLength);
  const view = new Uint8Array(buf);
  view[0] = op;
  new Uint8Array(buf, 1).set(new Uint8Array(data));
  return buf;
}

export function decodeMessage(buffer: ArrayBuffer): WSMessage {
  const view = new Uint8Array(buffer);
  const op = view[0] as OpCode;
  const data = buffer.byteLength > 1 ? buffer.slice(1) : undefined;
  return { op, data };
}