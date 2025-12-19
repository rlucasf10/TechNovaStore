/**
 * Routes - Definición de rutas HTTP para el chatbot
 * 
 * Autenticación:
 * - /health: Público (sin autenticación)
 * - /api/chat, /api/session: Autenticación OPCIONAL (personaliza si hay token)
 * - /api/admin/*: Autenticación OBLIGATORIA + rol admin
 */

import { Router } from 'express';
import { ChatbotController } from './ChatbotController';
import { authMiddleware, optionalAuthMiddleware, requireRole } from '../shared/middleware/auth';

export function createRoutes(controller: ChatbotController): Router {
  const router = Router();

  // Health check - Público (sin autenticación)
  router.get('/health', controller.health);

  // Session management - Autenticación opcional (personaliza si hay token)
  router.post('/api/session', optionalAuthMiddleware, controller.createSession);
  router.get('/api/chat/session/:sessionId', optionalAuthMiddleware, controller.getSession);

  // Chat - Autenticación opcional (personaliza si hay token)
  router.post('/api/chat', optionalAuthMiddleware, controller.chat);

  // Escalation - Autenticación opcional (personaliza si hay token)
  router.post('/api/chat/escalate', optionalAuthMiddleware, controller.escalate);

  // Admin endpoints - Autenticación OBLIGATORIA + rol admin
  router.get('/api/admin/logs', authMiddleware, requireRole(['admin']), controller.getLogs);
  router.post('/api/admin/restart', authMiddleware, requireRole(['admin']), controller.restart);

  return router;
}
