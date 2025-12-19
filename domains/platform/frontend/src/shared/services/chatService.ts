/**
 * Chat Service
 * 
 * Servicio para gestionar la comunicación con el chatbot mediante Socket.IO
 * Maneja sesiones de chat, envío de mensajes y streaming de respuestas
 */

import { Socket } from 'socket.io-client';
import {
  getSocket,
  connectSocket,
  disconnectSocket,
  isSocketConnected,
  SocketEvents,
  ChatMessagePayload,
  ChatStreamChunkPayload,
  ChatStreamEndPayload,
  ChatStreamErrorPayload,
  SessionCreatedPayload,
} from '@/shared/lib/socket';
import { ChatContext } from '@/shared/types';

/**
 * Tipos específicos del servicio de chat
 */
export interface CreateSessionOptions {
  userId?: number;
  context?: Partial<ChatContext>;
}

export interface SendMessageOptions {
  sessionId: string;
  message: string;
  context?: {
    productId?: string;
    categoryId?: string;
    orderId?: string;
  };
  aiProvider?: 'gemini' | 'fallback';
}

export interface ChatEventHandlers {
  onTyping?: () => void;
  onChunk?: (chunk: string, messageId: string) => void;
  onComplete?: (message: string, messageId: string, products?: any[], usingFallback?: boolean) => void;
  onError?: (error: string, messageId?: string) => void;
  onConnectionChange?: (status: 'connected' | 'disconnected' | 'reconnecting') => void;
  onReconnectAttempt?: (attemptNumber: number) => void;
  onReconnectFailed?: () => void;
}

/**
 * Clase ChatService
 * 
 * Gestiona la comunicación con el servicio de chatbot
 */
class ChatService {
  private socket: Socket | null = null;
  private currentSessionId: string | null = null;
  private eventHandlers: ChatEventHandlers = {};

  /**
   * Inicializar el servicio y conectar el socket
   */
  async initialize(): Promise<void> {
    if (this.socket && isSocketConnected()) {
      return;
    }

    try {
      await connectSocket();
      this.socket = getSocket();
      this.setupSocketListeners();
    } catch (error) {
      console.error('[ChatService] Error al conectar socket:', error);
      throw new Error('No se pudo conectar con el servicio de chat');
    }
  }

  /**
   * Configurar listeners de eventos del socket
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Evento: Bot está escribiendo
    this.socket.on(SocketEvents.BOT_TYPING, (isTyping: boolean) => {
      if (isTyping) {
        this.eventHandlers.onTyping?.();
      }
      // Nota: cuando isTyping es false, el evento onComplete ya maneja la limpieza
    });

    // Evento: Chunk de streaming recibido
    this.socket.on(SocketEvents.CHAT_STREAM_CHUNK, (data: ChatStreamChunkPayload) => {
      this.eventHandlers.onChunk?.(data.chunk, data.messageId);
    });

    // Evento: Streaming completado
    this.socket.on(SocketEvents.CHAT_STREAM_END, (data: ChatStreamEndPayload) => {
      this.eventHandlers.onComplete?.(
        data.fullMessage,
        data.messageId,
        data.products,
        data.usingFallback
      );
    });

    // Evento: Error en el streaming
    this.socket.on(SocketEvents.CHAT_STREAM_ERROR, (data: ChatStreamErrorPayload) => {
      this.eventHandlers.onError?.(data.error, data.messageId);
    });

    // Evento: Sesión creada
    this.socket.on(SocketEvents.SESSION_CREATED, (data: SessionCreatedPayload) => {
      this.currentSessionId = data.sessionId;
    });

    // Eventos de conexión
    this.socket.on(SocketEvents.CONNECT, () => {
      console.log('[ChatService] Socket conectado');
      this.eventHandlers.onConnectionChange?.('connected');
    });

    this.socket.on(SocketEvents.DISCONNECT, (reason) => {
      console.log('[ChatService] Socket desconectado:', reason);
      this.eventHandlers.onConnectionChange?.('disconnected');
      
      // Si la desconexión fue por el servidor, intentar reconectar
      if (reason === 'io server disconnect') {
        // El servidor cerró la conexión, reconectar manualmente
        this.socket?.connect();
      }
    });

    this.socket.on(SocketEvents.CONNECT_ERROR, (error) => {
      console.error('[ChatService] Error de conexión:', error);
      this.eventHandlers.onConnectionChange?.('disconnected');
    });

    this.socket.on(SocketEvents.RECONNECT_ATTEMPT, (attemptNumber) => {
      console.log(`[ChatService] Intento de reconexión #${attemptNumber}`);
      this.eventHandlers.onConnectionChange?.('reconnecting');
      this.eventHandlers.onReconnectAttempt?.(attemptNumber);
    });

    this.socket.on(SocketEvents.RECONNECT, (attemptNumber) => {
      console.log(`[ChatService] Reconectado después de ${attemptNumber} intentos`);
      this.eventHandlers.onConnectionChange?.('connected');
      
      // Si teníamos una sesión activa, volver a unirse
      if (this.currentSessionId) {
        this.socket?.emit(SocketEvents.JOIN_SESSION, { sessionId: this.currentSessionId });
      }
    });

    this.socket.on(SocketEvents.RECONNECT_ERROR, (error) => {
      console.error('[ChatService] Error en reconexión:', error);
      this.eventHandlers.onConnectionChange?.('reconnecting');
    });

    this.socket.on(SocketEvents.RECONNECT_FAILED, () => {
      console.error('[ChatService] Falló la reconexión después de todos los intentos');
      this.eventHandlers.onConnectionChange?.('disconnected');
      this.eventHandlers.onReconnectFailed?.();
      this.eventHandlers.onError?.('No se pudo reconectar con el servidor. Por favor, recarga la página.');
    });
  }

  /**
   * Crear una nueva sesión de chat
   */
  async createSession(options: CreateSessionOptions = {}): Promise<string> {
    if (!this.socket || !isSocketConnected()) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket no inicializado'));
        return;
      }

      // Emitir evento para crear sesión
      this.socket.emit('create_session', {
        userId: options.userId,
        context: options.context || {},
      });

      // Esperar respuesta con el sessionId
      const timeout = setTimeout(() => {
        reject(new Error('Timeout al crear sesión'));
      }, 10000);

      this.socket.once(SocketEvents.SESSION_CREATED, (data: SessionCreatedPayload) => {
        clearTimeout(timeout);
        this.currentSessionId = data.sessionId;
        resolve(data.sessionId);
      });
    });
  }

  /**
   * Enviar un mensaje al chatbot
   */
  sendMessage(options: SendMessageOptions): void {
    if (!this.socket || !isSocketConnected()) {
      throw new Error('Socket no conectado. Llama a initialize() primero.');
    }

    const payload: ChatMessagePayload = {
      sessionId: options.sessionId,
      message: options.message,
      context: options.context,
      aiProvider: options.aiProvider,
    };

    this.socket.emit(SocketEvents.CHAT_MESSAGE_STREAM, payload);
  }

  /**
   * Registrar handlers para eventos del chat
   */
  setEventHandlers(handlers: ChatEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * Limpiar handlers de eventos
   */
  clearEventHandlers(): void {
    this.eventHandlers = {};
  }

  /**
   * Unirse a una sesión existente
   */
  joinSession(sessionId: string): void {
    if (!this.socket || !isSocketConnected()) {
      throw new Error('Socket no conectado');
    }

    this.socket.emit(SocketEvents.JOIN_SESSION, { sessionId });
    this.currentSessionId = sessionId;
  }

  /**
   * Salir de la sesión actual
   */
  leaveSession(): void {
    if (!this.socket || !this.currentSessionId) return;

    this.socket.emit(SocketEvents.LEAVE_SESSION, { sessionId: this.currentSessionId });
    this.currentSessionId = null;
  }

  /**
   * Obtener el ID de la sesión actual
   */
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Verificar si el socket está conectado
   */
  isConnected(): boolean {
    return isSocketConnected();
  }

  /**
   * Desconectar el socket y limpiar recursos
   */
  disconnect(): void {
    this.leaveSession();
    this.clearEventHandlers();
    disconnectSocket();
    this.socket = null;
  }

  /**
   * Obtener la instancia del socket (para casos avanzados)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Exportar instancia singleton
export const chatService = new ChatService();

// Exportar clase para testing
export default ChatService;
