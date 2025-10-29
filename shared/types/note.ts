// shared/types/Note.ts - Contrato de datos para DB y WebSocket
// ÚLTIMO CAMBIO: 2025-10-28 - KATANA v7 - Tipado estricto para sincronización real-time
// IMPORTANCIA: CRÍTICO - Define la estructura de notas en toda la aplicación

export interface Note {
  id: string;              // UUID v4
  userId: string;          // Supabase auth user id
  title: string;           // Título de la nota
  content: string;         // Contenido completo
  createdAt: Date;         // Fecha de creación
  updatedAt: Date;         // Última modificación
  version: number;         // Control de concurrencia (optimistic locking)
}

// Tipo para mensajes WebSocket binarios
export interface NoteMessage {
  op: number;             // Operation code (ver shared/messages/ws.ts)
  note: Note;             // Nota completa
}