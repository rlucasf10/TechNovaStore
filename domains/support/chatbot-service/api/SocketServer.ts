/**
 * Socket.IO Server - Manejo de comunicación en tiempo real
 * 
 * Implementa streaming de respuestas del chatbot mediante Socket.IO
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { ProcessMessage } from '../process-message/ProcessMessage';
import { ManageSession } from '../manage-session/ManageSession';
import { MetricsCollector } from '../shared/MetricsCollector';
import { logger } from '../shared/utils/logger';

interface ChatMessagePayload {
  sessionId: string;
  message: string;
  context?: {
    productId?: string;
    categoryId?: string;
    orderId?: string;
  };
  aiProvider?: 'gemini' | 'fallback';
}

interface CreateSessionPayload {
  userId?: number;
  context?: Record<string, unknown>;
}

export class SocketServer {
  private io: SocketIOServer;
  private processMessage: ProcessMessage;
  private manageSession: ManageSession;
  private metricsCollector: MetricsCollector;

  constructor(
    httpServer: HTTPServer,
    processMessage: ProcessMessage,
    manageSession: ManageSession,
    frontendUrl: string,
    metricsCollector: MetricsCollector
  ) {
    this.processMessage = processMessage;
    this.manageSession = manageSession;
    this.metricsCollector = metricsCollector;

    // Configurar Socket.IO
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: frontendUrl,
        credentials: true,
        methods: ['GET', 'POST']
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  /**
   * Configurar manejadores de eventos de Socket.IO
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info('Cliente Socket.IO conectado', { socketId: socket.id });

      // Evento: Crear sesión
      socket.on('create_session', async (data: CreateSessionPayload) => {
        try {
          const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const session = this.manageSession.createSession(sessionId, data.userId?.toString());

          socket.emit('session_created', {
            sessionId: session.sessionId
          });

          logger.info('Sesión creada vía Socket.IO', { sessionId: session.sessionId, socketId: socket.id });
        } catch (error) {
          logger.error('Error al crear sesión vía Socket.IO', { 
            error: error instanceof Error ? error.message : error, 
            socketId: socket.id 
          });
          socket.emit('session_error', {
            error: 'No se pudo crear la sesión'
          });
        }
      });

      // Evento: Unirse a una sesión
      socket.on('join_session', (data: { sessionId: string }) => {
        socket.join(data.sessionId);
        logger.debug('Cliente se unió a sesión', { socketId: socket.id, sessionId: data.sessionId });
      });

      // Evento: Salir de una sesión
      socket.on('leave_session', (data: { sessionId: string }) => {
        socket.leave(data.sessionId);
        logger.debug('Cliente salió de sesión', { socketId: socket.id, sessionId: data.sessionId });
      });

      // Evento: Mensaje de chat con streaming
      socket.on('chat_message_stream', async (data: ChatMessagePayload) => {
        const { sessionId, message, context, aiProvider } = data;
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = Date.now();
        let hadError = false;

        try {
          logger.debug('Procesando mensaje vía Socket.IO', { sessionId, aiProvider, socketId: socket.id });

          // Emitir evento de "escribiendo"
          socket.emit('bot_typing', true);

          // Obtener sesión
          const session = await this.manageSession.getSession(sessionId);
          
          if (!session) {
            throw new Error('Sesión no encontrada');
          }

          // Actualizar preferencia de AI provider en la sesión
          if (aiProvider) {
            session.preferredAIProvider = aiProvider;
          }

          // Procesar mensaje con streaming
          const result = await this.processMessage.execute(
            message,
            session,
            (chunk: string) => {
              // Emitir cada chunk al cliente
              socket.emit('chat_stream_chunk', {
                sessionId,
                messageId,
                chunk
              });
            }
          );

          // Emitir mensaje completo al finalizar
          const productsToSend = result.products || [];
          
          // Log de productos enviados
          if (productsToSend.length > 0) {
            logger.debug('Productos enviados al frontend', { 
              sessionId,
              products: productsToSend.map(p => ({
                sku: p.sku,
                name: p.name,
                images: p.images,
                price: p.price
              }))
            });
          }
          
          socket.emit('chat_stream_end', {
            sessionId,
            messageId,
            fullMessage: result.message,
            products: productsToSend,
            usingFallback: result.usingFallback || false
          });

          // Registrar métricas
          const responseTime = Date.now() - startTime;
          const usedProvider = result.usingFallback ? 'fallback' : (aiProvider || 'gemini');
          this.metricsCollector.recordMessage(responseTime, usedProvider, false);

          logger.info('Mensaje procesado exitosamente vía Socket.IO', { sessionId, responseTime, provider: usedProvider });
        } catch (error) {
          hadError = true;
          logger.error('Error al procesar mensaje vía Socket.IO', { 
            error: error instanceof Error ? error.message : error, 
            sessionId, 
            socketId: socket.id 
          });
          
          socket.emit('chat_stream_error', {
            sessionId,
            messageId,
            error: error instanceof Error ? error.message : 'Error al procesar el mensaje'
          });

          // Registrar métricas de error
          const responseTime = Date.now() - startTime;
          this.metricsCollector.recordMessage(responseTime, aiProvider || 'fallback', true);
        } finally {
          // Detener indicador de "escribiendo"
          socket.emit('bot_typing', false);
        }
      });

      // Evento: Desconexión
      socket.on('disconnect', () => {
        logger.info('Cliente Socket.IO desconectado', { socketId: socket.id });
      });

      // Evento: Error
      socket.on('error', (error) => {
        logger.error('Error en socket', { socketId: socket.id, error: error instanceof Error ? error.message : error });
      });
    });

    logger.info('Event handlers de Socket.IO configurados');
  }

  /**
   * Obtener instancia de Socket.IO (para casos avanzados)
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}
