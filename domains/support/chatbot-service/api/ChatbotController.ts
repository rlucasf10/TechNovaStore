/**
 * ChatbotController - Controlador HTTP para el chatbot
 * 
 * Maneja todas las peticiones HTTP y las delega a los casos de uso correspondientes
 */

import { Request, Response } from 'express';
import { ProcessMessage, ChatSession } from '../process-message/ProcessMessage';
import { ManageSession } from '../manage-session/ManageSession';
import { EscalateToHuman } from '../escalate-to-human/EscalateToHuman';
import { MetricsCollector } from '../shared/MetricsCollector';
import { config } from '../config';
import { logger } from '../shared/utils/logger';

export class ChatbotController {
  constructor(
    private processMessage: ProcessMessage,
    private manageSession: ManageSession,
    private escalateToHuman: EscalateToHuman,
    private metricsCollector: MetricsCollector
  ) {}

  /**
   * Health check endpoint - devuelve estado detallado del chatbot
   */
  health = (req: Request, res: Response) => {
    // Verificar si Gemini está configurado (tiene API key)
    const geminiConfigured = config.useGemini && !!config.geminiApiKey;
    
    // Verificar si Ollama está habilitado
    const ollamaEnabled = config.useOllama;
    
    // Determinar el modo actual
    const usingFallback = !geminiConfigured && !ollamaEnabled;
    
    // Determinar estado general
    let status: 'healthy' | 'warning' | 'error' = 'healthy';
    if (!geminiConfigured && !ollamaEnabled) {
      status = 'warning'; // Solo fallback disponible
    }

    // Obtener métricas del collector
    const metrics = this.metricsCollector.getMetrics();

    return res.json({
      status,
      service: 'chatbot',
      timestamp: new Date().toISOString(),
      // Estado de los proveedores de IA
      ollamaAvailable: ollamaEnabled,
      geminiAvailable: geminiConfigured,
      usingFallback,
      // Información del modelo actual
      lastModelUsed: geminiConfigured ? config.geminiModel : (ollamaEnabled ? config.ollamaModel : 'fallback'),
      // Métricas de sesiones (del ManageSession)
      totalSessions: this.manageSession.getTotalSessions?.() || 0,
      activeSessions: this.manageSession.getActiveSessions?.() || 0,
      // Métricas de rendimiento (del MetricsCollector)
      messagesProcessed: metrics.messagesProcessed,
      averageResponseTime: metrics.averageResponseTime,
      errorRate: metrics.errorRate,
      fallbackUsagePercent: metrics.fallbackUsagePercent,
      // Configuración actual
      config: {
        aiProvider: config.aiProvider,
        geminiModel: config.geminiModel,
        ollamaModel: config.ollamaModel
      }
    });
  };

  /**
   * Crear nueva sesión
   */
  createSession = (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const session = this.manageSession.createSession(sessionId, userId);

      return res.json({
        session_id: sessionId,
        created_at: session.createdAt,
        message: 'Session created successfully'
      });
    } catch (error) {
      logger.error('Error al crear sesión', { error: error instanceof Error ? error.message : error });
      return res.status(500).json({
        error: 'Failed to create session'
      });
    }
  };

  /**
   * Procesar mensaje de chat
   */
  chat = async (req: Request, res: Response) => {
    const { message, sessionId, userId, aiProvider } = req.body;
    
    try {
      if (!message || !sessionId) {
        return res.status(400).json({
          error: 'Message and sessionId are required'
        });
      }

      // Obtener o crear sesión
      const session = this.manageSession.getOrCreateSession(sessionId, userId);

      // Actualizar preferencia de AI provider en el contexto de la sesión
      if (aiProvider) {
        session.context.aiProvider = aiProvider;
      }

      // Procesar mensaje
      const response = await this.processMessage.execute(message, session);

      return res.json(response);
    } catch (error) {
      logger.error('Error al procesar mensaje de chat', { 
        error: error instanceof Error ? error.message : error, 
        sessionId, 
        userId 
      });
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.'
      });
    }
  };

  /**
   * Obtener información de sesión
   */
  getSession = (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const session = this.manageSession.getSession(sessionId);

    if (session) {
      return res.json({
        sessionId: session.sessionId,
        userId: session.userId,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        intentHistory: session.context.previousIntents.slice(-5)
      });
    } else {
      return res.status(404).json({ error: 'Session not found' });
    }
  };

  /**
   * Escalar a soporte humano
   */
  escalate = async (req: Request, res: Response) => {
    const {
      sessionId,
      customerEmail,
      customerName,
      reason,
      customMessage,
      userId,
      orderId
    } = req.body;
    
    try {
      const result = await this.escalateToHuman.execute({
        sessionId,
        customerEmail,
        customerName,
        reason,
        customMessage,
        userId,
        orderId
      });

      return res.json({
        success: true,
        data: {
          ticketId: result.ticketId,
          ticketNumber: result.ticketNumber,
          message: result.message
        }
      });
    } catch (error) {
      logger.error('Error al escalar a soporte humano', { 
        error: error instanceof Error ? error.message : error, 
        sessionId, 
        customerEmail 
      });
      return res.status(500).json({
        error: 'Failed to escalate to human support'
      });
    }
  };

  /**
   * Obtener logs recientes del chatbot
   */
  getLogs = (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = this.metricsCollector.getRecentLogs(limit);

      return res.json({
        success: true,
        data: {
          logs,
          total: logs.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error al obtener logs', { error: error instanceof Error ? error.message : error });
      return res.status(500).json({
        success: false,
        error: 'Error al obtener logs del chatbot'
      });
    }
  };

  /**
   * Reiniciar el servicio del chatbot (limpia sesiones y métricas)
   */
  restart = (req: Request, res: Response) => {
    try {
      // Limpiar todas las sesiones activas
      const clearedSessions = this.manageSession.clearAllSessions?.() || 0;
      
      // Resetear métricas
      this.metricsCollector.reset();

      logger.info('Servicio reiniciado', { clearedSessions });

      return res.json({
        success: true,
        data: {
          message: 'Servicio reiniciado correctamente',
          clearedSessions,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error al reiniciar servicio', { error: error instanceof Error ? error.message : error });
      return res.status(500).json({
        success: false,
        error: 'Error al reiniciar el servicio'
      });
    }
  };
}
