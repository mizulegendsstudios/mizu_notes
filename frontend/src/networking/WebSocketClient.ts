// app/src/networking/WebSocketClient.ts - Cliente WebSocket para KATANA v7
// ÚLTIMO CAMBIO: 2025-10-28 - Implementación de cliente con predicción y reconexión
// IMPORTANCIA: CRÍTICO - Maneja la comunicación en tiempo real desde el cliente

import { OpCode, encodeMessage, decodeMessage } from '../../../shared/messages/ws';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandlers: Map<OpCode, Function>;
  private reconnectAttempts: number;
  private maxReconnectAttempts: number;
  private reconnectDelay: number;
  private isConnecting: boolean;
  private isAuthenticated: boolean;

  constructor(private url: string) {
    this.messageHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnecting = false;
    this.isAuthenticated = false;
  }

  // Conecta al servidor WebSocket
  // ÚLTIMO CAMBIO: 2025-10-28 - Implementación con reconexión automática
  // IMPORTANCIA: CRÍTICO - Establece la conexión con el servidor
  public connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
        resolve();
        return;
      }

      this.isConnecting = true;
      this.ws = new WebSocket(this.url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        console.log('🔗 Conectado al servidor WebSocket');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Autenticar si se proporcionó token
        if (token) {
          this.authenticate(token);
        }
        
        resolve();
      };

      this.ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          this.handleMessage(event.data);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 Desconectado del servidor WebSocket');
        this.isConnecting = false;
        this.isAuthenticated = false;
        
        // Intentar reconectar
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('❌ Error WebSocket:', error);
        this.isConnecting = false;
        reject(error);
      };
    });
  }

  // Intenta reconectar automáticamente
  // ÚLTIMO CAMBIO: 2025-10-28 - Lógica de reconexión con backoff exponencial
  // IMPORTANCIA: ALTA - Mantiene la conexión estable ante interrupciones
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Máximo de intentos de reconexión alcanzado');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Intentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts}) en ${delay}ms`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Maneja los mensajes recibidos
  // ÚLTIMO CAMBIO: 2025-10-28 - Procesamiento de mensajes binarios
  // IMPORTANCIA: CRÍTICO - Procesa todos los mensajes del servidor
  private handleMessage(buffer: ArrayBuffer) {
    try {
      const message = decodeMessage(buffer);
      const handler = this.messageHandlers.get(message.op);
      
      if (handler) {
        handler(message.data);
      } else {
        console.warn('⚠️ No hay handler para el opcode:', message.op);
      }
    } catch (error) {
      console.error('❌ Error procesando mensaje:', error);
    }
  }

  // Registra un handler para un tipo de mensaje
  // ÚLTIMO CAMBIO: 2025-10-28 - Sistema de handlers tipado
  // IMPORTANCIA: ALTA - Permite reaccionar a los mensajes del servidor
  public onMessage(opCode: OpCode, handler: Function) {
    this.messageHandlers.set(opCode, handler);
  }

  // Envía un mensaje binario al servidor
  // ÚLTIMO CAMBIO: 2025-10-28 - Envío de mensajes binarios
  // IMPORTANCIA: ALTA - Permite comunicarse con el servidor
  public sendMessage(opCode: OpCode, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const buffer = encodeMessage(opCode, data);
      this.ws.send(buffer);
    } else {
      console.error('❌ WebSocket no conectado');
    }
  }

  // Autentica al usuario
  // ÚLTIMO CAMBIO: 2025-10-28 - Implementación de autenticación
  // IMPORTANCIA: CRÍTICO - Permite acceder a funcionalidades protegidas
  public authenticate(token: string) {
    this.sendMessage(OpCode.AUTH, token);
  }

  // Solicita la lista de notas
  // ÚLTIMO CAMBIO: 2025-10-28 - Método para obtener notas
  // IMPORTANCIA: ALTA - Permite cargar las notas del usuario
  public getNotes() {
    this.sendMessage(OpCode.NOTE_LIST, {});
  }

  // Crea una nueva nota
  // ÚLTIMO CAMBIO: 2025-10-28 - Método para crear notas
  // IMPORTANCIA: ALTA - Permite crear nuevas notas
  public createNote(title: string, content: string) {
    this.sendMessage(OpCode.NOTE_CREATE, { title, content });
  }

  // Actualiza una nota existente
  // ÚLTIMO CAMBIO: 2025-10-28 - Método para actualizar notas
  // IMPORTANCIA: ALTA - Permite editar notas existentes
  public updateNote(noteId: string, title: string, content: string) {
    this.sendMessage(OpCode.NOTE_UPDATE, { noteId, title, content });
  }

  // Elimina una nota
  // ÚLTIMO CAMBIO: 2025-10-28 - Método para eliminar notas
  // IMPORTANCIA: ALTA - Permite eliminar notas
  public deleteNote(noteId: string) {
    this.sendMessage(OpCode.NOTE_DELETE, { noteId });
  }

  // Cierra la conexión
  // ÚLTIMO CAMBIO: 2025-10-28 - Implementación de cierre controlado
  // IMPORTANCIA: ALTA - Permite cerrar la conexión de forma limpia
  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}