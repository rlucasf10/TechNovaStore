/**
 * Configuración de Socket.IO Client
 * 
 * Cliente de Socket.IO para comunicación en tiempo real con el chatbot
 */

import { io, Socket } from 'socket.io-client';

// URL del servidor de chatbot
const CHATBOT_URL = process.env.NEXT_PUBLIC_CHATBOT_URL || 'http://localhost:3009';

// Configuración del socket
const socketConfig = {
  autoConnect: false, // No conectar automáticamente
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket', 'polling'], // Preferir websocket
};

// Instancia del socket (singleton)
let socketInstance: Socket | null = null;

/**
 * Obtener o crear instancia del socket
 */
export const getSocket = (): Socket => {
  if (!socketInstance) {
    socketInstance = io(CHATBOT_URL, socketConfig);
  }
  return socketInstance;
};

/**
 * Conectar el socket
 */
export const connectSocket = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const socket = getSocket();
    
    if (socket.connected) {
      resolve();
      return;
    }
    
    socket.connect();
    
    socket.once('connect', () => {
      // Socket conectado exitosamente
      resolve();
    });
    
    socket.once('connect_error', (error) => {
      // Error de conexión del socket
      reject(error);
    });
  });
};

/**
 * Desconectar el socket
 */
export const disconnectSocket = (): void => {
  if (socketInstance) {
    socketInstance.disconnect();
    // Socket desconectado
  }
};

/**
 * Verificar si el socket está conectado
 */
export const isSocketConnected = (): boolean => {
  return socketInstance?.connected ?? false;
};

/**
 * Eventos del socket
 */
export const SocketEvents = {
  // Eventos del cliente
  CHAT_MESSAGE_STREAM: 'chat_message_stream',
  JOIN_SESSION: 'join_session',
  LEAVE_SESSION: 'leave_session',
  
  // Eventos del servidor
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  RECONNECT: 'reconnect',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  RECONNECT_ERROR: 'reconnect_error',
  RECONNECT_FAILED: 'reconnect_failed',
  
  // Eventos del chatbot
  BOT_TYPING: 'bot_typing',
  CHAT_STREAM_CHUNK: 'chat_stream_chunk',
  CHAT_STREAM_END: 'chat_stream_end',
  CHAT_STREAM_ERROR: 'chat_stream_error',
  SESSION_CREATED: 'session_created',
} as const;

/**
 * Tipos de datos para eventos
 */
export interface ChatMessagePayload {
  sessionId: string;
  message: string;
  context?: {
    productId?: string;
    categoryId?: string;
    orderId?: string;
  };
}

export interface ChatStreamChunkPayload {
  sessionId: string;
  chunk: string;
  messageId: string;
}

export interface ChatStreamEndPayload {
  sessionId: string;
  messageId: string;
  fullMessage: string;
  products?: Array<{
    id: string;
    name: string;
    price: number;
    image: string;
  }>;
  usingFallback: boolean;
}

export interface ChatStreamErrorPayload {
  sessionId: string;
  error: string;
  messageId?: string;
}

export interface SessionCreatedPayload {
  sessionId: string;
}

/**
 * Hook helper para usar el socket (se puede crear un custom hook después)
 */
export const useSocketEvents = (socket: Socket) => {
  const on = <T = unknown>(event: string, handler: (data: T) => void) => {
    socket.on(event, handler);
    return () => socket.off(event, handler);
  };
  
  const emit = <T = unknown>(event: string, data: T) => {
    socket.emit(event, data);
  };
  
  return { on, emit };
};

export default getSocket;
