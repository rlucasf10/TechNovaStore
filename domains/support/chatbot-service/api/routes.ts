/**
 * Routes - Definición de rutas HTTP para el chatbot
 */

import { Router } from 'express';
import { ChatbotController } from './ChatbotController';

export function createRoutes(controller: ChatbotController): Router {
  const router = Router();

  // Health check
  router.get('/health', controller.health);

  // Session management
  router.post('/api/session', controller.createSession);
  router.get('/api/chat/session/:sessionId', controller.getSession);

  // Chat
  router.post('/api/chat', controller.chat);

  // Escalation
  router.post('/api/chat/escalate', controller.escalate);

  return router;
}
