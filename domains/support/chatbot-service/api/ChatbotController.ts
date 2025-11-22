/**
 * ChatbotController - Controlador HTTP para el chatbot
 * 
 * Maneja todas las peticiones HTTP y las delega a los casos de uso correspondientes
 */

import { Request, Response } from 'express';
import { ProcessMessage, ChatSession } from '../process-message/ProcessMessage';
import { ManageSession } from '../manage-session/ManageSession';
import { EscalateToHuman } from '../escalate-to-human/EscalateToHuman';

export class ChatbotController {
  constructor(
    private processMessage: ProcessMessage,
    private manageSession: ManageSession,
    private escalateToHuman: EscalateToHuman
  ) {}

  /**
   * Health check endpoint
   */
  health = (req: Request, res: Response) => {
    return res.json({
      status: 'healthy',
      service: 'chatbot',
      timestamp: new Date().toISOString()
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
      console.error('Error creating session:', error);
      return res.status(500).json({
        error: 'Failed to create session'
      });
    }
  };

  /**
   * Procesar mensaje de chat
   */
  chat = async (req: Request, res: Response) => {
    try {
      const { message, sessionId, userId } = req.body;

      if (!message || !sessionId) {
        return res.status(400).json({
          error: 'Message and sessionId are required'
        });
      }

      // Obtener o crear sesión
      const session = this.manageSession.getOrCreateSession(sessionId, userId);

      // Procesar mensaje
      const response = await this.processMessage.execute(message, session);

      return res.json(response);
    } catch (error) {
      console.error('Error processing chat message:', error);
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
    try {
      const {
        sessionId,
        customerEmail,
        customerName,
        reason,
        customMessage,
        userId,
        orderId
      } = req.body;

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
      console.error('Error escalating to human support:', error);
      return res.status(500).json({
        error: 'Failed to escalate to human support'
      });
    }
  };
}
