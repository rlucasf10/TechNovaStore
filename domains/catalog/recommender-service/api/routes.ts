/**
 * Rutas del servicio de recomendaciones
 * 
 * ✅ SEGURIDAD: Implementa autenticación en endpoints privados
 * 
 * Endpoints públicos (sin autenticación):
 * - GET /trending - Productos trending (público para todos)
 * - GET /product/:productId/similar - Productos similares (público)
 * 
 * Endpoints privados (requieren autenticación):
 * - GET /user/:userId - Recomendaciones personalizadas
 * - POST /interaction - Registrar interacción
 * - GET /session/:sessionId - Recomendaciones por sesión
 * 
 * Endpoints de administración:
 * - POST /models/update - Actualizar modelos (solo admin)
 */

import { Router } from 'express';
import { RecommendationController } from './RecommendationController';
import { authMiddleware, requireRole } from '../shared/middleware/auth';

export function createRecommendationRoutes(controller: RecommendationController): Router {
  const router = Router();

  // ✅ Endpoints públicos (sin autenticación)
  router.get('/trending', controller.handleGetTrendingProducts.bind(controller));
  router.get('/product/:productId/similar', controller.handleGetSimilarProducts.bind(controller));

  // ✅ Endpoints privados (requieren autenticación)
  router.get('/user/:userId', authMiddleware, controller.handleGetUserRecommendations.bind(controller));
  router.post('/interaction', authMiddleware, controller.handleRecordInteraction.bind(controller));
  router.get('/session/:sessionId', authMiddleware, controller.handleGetSessionRecommendations.bind(controller));

  // ✅ Endpoints de administración (solo admin)
  router.post('/models/update', authMiddleware, requireRole(['admin']), controller.handleUpdateModels.bind(controller));

  return router;
}
