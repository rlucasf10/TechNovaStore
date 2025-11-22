/**
 * Rutas del servicio de recomendaciones
 */

import { Router } from 'express';
import { RecommendationController } from './RecommendationController';

export function createRecommendationRoutes(controller: RecommendationController): Router {
  const router = Router();

  router.get('/user/:userId', controller.handleGetUserRecommendations.bind(controller));
  router.get('/product/:productId/similar', controller.handleGetSimilarProducts.bind(controller));
  router.post('/interaction', controller.handleRecordInteraction.bind(controller));
  router.get('/trending', controller.handleGetTrendingProducts.bind(controller));
  router.get('/session/:sessionId', controller.handleGetSessionRecommendations.bind(controller));
  router.post('/models/update', controller.handleUpdateModels.bind(controller));

  return router;
}
