/**
 * Tests para ChatService
 */

import ChatService from '../../src/shared/services/chatService';
import * as socketLib from '../../src/shared/lib/socket';

// Mock del módulo socket
jest.mock('../../src/shared/lib/socket', () => ({
  getSocket: jest.fn(),
  connectSocket: jest.fn(),
  disconnectSocket: jest.fn(),
  isSocketConnected: jest.fn(),
  SocketEvents: {
    CHAT_MESSAGE_STREAM: 'chat_message_stream',
    JOIN_SESSION: 'join_session',
    LEAVE_SESSION: 'leave_session',
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    CONNECT_ERROR: 'connect_error',
    RECONNECT: 'reconnect',
    RECONNECT_ATTEMPT: 'reconnect_attempt',
    RECONNECT_ERROR: 'reconnect_error',
    RECONNECT_FAILED: 'reconnect_failed',
    BOT_TYPING: 'bot_typing',
    CHAT_STREAM_CHUNK: 'chat_stream_chunk',
    CHAT_STREAM_END: 'chat_stream_end',
    CHAT_STREAM_ERROR: 'chat_stream_error',
    SESSION_CREATED: 'session_created',
  },
}));

describe('ChatService', () => {
  let chatService: ChatService;
  let mockSocket: any;

  beforeEach(() => {
    // Crear mock del socket
    mockSocket = {
      on: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
      off: jest.fn(),
      connected: true,
    };

    // Configurar mocks
    (socketLib.getSocket as jest.Mock).mockReturnValue(mockSocket);
    (socketLib.connectSocket as jest.Mock).mockResolvedValue(undefined);
    (socketLib.isSocketConnected as jest.Mock).mockReturnValue(true);

    // Crear nueva instancia del servicio
    chatService = new ChatService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('debe conectar el socket correctamente', async () => {
      await chatService.initialize();

      expect(socketLib.connectSocket).toHaveBeenCalled();
      expect(socketLib.getSocket).toHaveBeenCalled();
      expect(mockSocket.on).toHaveBeenCalled();
    });

    it('no debe reconectar si ya está conectado', async () => {
      await chatService.initialize();
      jest.clearAllMocks();

      await chatService.initialize();

      expect(socketLib.connectSocket).not.toHaveBeenCalled();
    });

    it('debe lanzar error si falla la conexión', async () => {
      (socketLib.connectSocket as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      await expect(chatService.initialize()).rejects.toThrow('No se pudo conectar con el servicio de chat');
    });
  });

  describe('createSession', () => {
    it('debe crear una sesión correctamente', async () => {
      await chatService.initialize();

      const sessionId = 'test-session-123';
      
      // Simular respuesta del servidor
      setTimeout(() => {
        const sessionCreatedHandler = mockSocket.once.mock.calls.find(
          (call: any) => call[0] === 'session_created'
        )?.[1];
        sessionCreatedHandler?.({ sessionId });
      }, 10);

      const result = await chatService.createSession({ userId: 1 });

      expect(result).toBe(sessionId);
      expect(mockSocket.emit).toHaveBeenCalledWith('create_session', {
        userId: 1,
        context: {},
      });
    });

    it('debe inicializar el socket si no está conectado', async () => {
      (socketLib.isSocketConnected as jest.Mock).mockReturnValue(false);

      const sessionId = 'test-session-123';
      
      setTimeout(() => {
        const sessionCreatedHandler = mockSocket.once.mock.calls.find(
          (call: any) => call[0] === 'session_created'
        )?.[1];
        sessionCreatedHandler?.({ sessionId });
      }, 10);

      await chatService.createSession();

      expect(socketLib.connectSocket).toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('debe enviar un mensaje correctamente', async () => {
      await chatService.initialize();

      const options = {
        sessionId: 'test-session-123',
        message: 'Hola, necesito ayuda',
        context: { productId: 'prod-123' },
      };

      chatService.sendMessage(options);

      expect(mockSocket.emit).toHaveBeenCalledWith('chat_message_stream', {
        sessionId: options.sessionId,
        message: options.message,
        context: options.context,
      });
    });

    it('debe lanzar error si el socket no está conectado', () => {
      expect(() => {
        chatService.sendMessage({
          sessionId: 'test-session',
          message: 'test',
        });
      }).toThrow('Socket no conectado');
    });
  });

  describe('setEventHandlers', () => {
    it('debe registrar handlers de eventos', async () => {
      await chatService.initialize();

      const handlers = {
        onTyping: jest.fn(),
        onChunk: jest.fn(),
        onComplete: jest.fn(),
        onError: jest.fn(),
      };

      chatService.setEventHandlers(handlers);

      // Simular evento bot_typing con isTyping=true
      const typingHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'bot_typing'
      )?.[1];
      
      // Verificar que el handler existe antes de llamarlo
      if (typingHandler) {
        typingHandler(true); // Pasar true para que se llame onTyping
        expect(handlers.onTyping).toHaveBeenCalled();
      } else {
        // Si no se registró el handler, el test debe fallar con un mensaje claro
        throw new Error('Handler bot_typing no fue registrado');
      }
    });

    it('debe llamar onChunk cuando llega un chunk', async () => {
      await chatService.initialize();

      const onChunk = jest.fn();
      chatService.setEventHandlers({ onChunk });

      // Simular evento chat_stream_chunk
      const chunkHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'chat_stream_chunk'
      )?.[1];
      chunkHandler?.({ chunk: 'Hola', messageId: 'msg-123' });

      expect(onChunk).toHaveBeenCalledWith('Hola', 'msg-123');
    });

    it('debe llamar onComplete cuando termina el streaming', async () => {
      await chatService.initialize();

      const onComplete = jest.fn();
      chatService.setEventHandlers({ onComplete });

      // Simular evento chat_stream_end
      const endHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'chat_stream_end'
      )?.[1];
      endHandler?.({
        fullMessage: 'Mensaje completo',
        messageId: 'msg-123',
        products: [],
        usingFallback: false,
      });

      expect(onComplete).toHaveBeenCalledWith('Mensaje completo', 'msg-123', [], false);
    });

    it('debe llamar onError cuando hay un error', async () => {
      await chatService.initialize();

      const onError = jest.fn();
      chatService.setEventHandlers({ onError });

      // Simular evento chat_stream_error
      const errorHandler = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'chat_stream_error'
      )?.[1];
      errorHandler?.({ error: 'Error de prueba', messageId: 'msg-123' });

      expect(onError).toHaveBeenCalledWith('Error de prueba', 'msg-123');
    });
  });

  describe('joinSession y leaveSession', () => {
    it('debe unirse a una sesión existente', async () => {
      await chatService.initialize();

      chatService.joinSession('existing-session-123');

      expect(mockSocket.emit).toHaveBeenCalledWith('join_session', {
        sessionId: 'existing-session-123',
      });
      expect(chatService.getCurrentSessionId()).toBe('existing-session-123');
    });

    it('debe salir de la sesión actual', async () => {
      await chatService.initialize();
      chatService.joinSession('test-session');

      chatService.leaveSession();

      expect(mockSocket.emit).toHaveBeenCalledWith('leave_session', {
        sessionId: 'test-session',
      });
      expect(chatService.getCurrentSessionId()).toBeNull();
    });
  });

  describe('disconnect', () => {
    it('debe desconectar y limpiar recursos', async () => {
      await chatService.initialize();
      chatService.joinSession('test-session');
      chatService.setEventHandlers({ onTyping: jest.fn() });

      chatService.disconnect();

      expect(socketLib.disconnectSocket).toHaveBeenCalled();
      expect(chatService.getCurrentSessionId()).toBeNull();
    });
  });

  describe('isConnected', () => {
    it('debe retornar el estado de conexión', async () => {
      (socketLib.isSocketConnected as jest.Mock).mockReturnValue(true);
      expect(chatService.isConnected()).toBe(true);

      (socketLib.isSocketConnected as jest.Mock).mockReturnValue(false);
      expect(chatService.isConnected()).toBe(false);
    });
  });
});
