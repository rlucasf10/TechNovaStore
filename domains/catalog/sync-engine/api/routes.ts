/**
 * Rutas del Sync Engine
 * 
 * ✅ SEGURIDAD: Todas las rutas administrativas requieren autenticación y rol admin
 * Solo /health y /metrics son públicos (para monitoreo)
 */

import express, { Router } from 'express';
import { SyncEngineController } from './SyncEngineController';
import { authMiddleware, requireRole } from '../shared/middleware/auth';

export function createRoutes(controller: SyncEngineController): Router {
  const router = express.Router();

  // ✅ Endpoints públicos (sin autenticación) - para monitoreo
  router.get('/health', (req, res) => controller.handleHealthCheck(req, res));
  router.get('/metrics', (req, res) => controller.handleGetMetrics(req, res));

  // ✅ Endpoints administrativos (requieren autenticación + rol admin)
  // Status and metrics detallados
  router.get('/status', authMiddleware, requireRole(['admin']), (req, res) => controller.handleGetStatus(req, res));

  // Cache
  router.get('/cache/stats', authMiddleware, requireRole(['admin']), (req, res) => controller.handleGetCacheStats(req, res));

  // Pricing
  router.get('/pricing/alerts', authMiddleware, requireRole(['admin']), (req, res) => controller.handleGetPricingAlerts(req, res));
  router.post('/pricing/compare', authMiddleware, requireRole(['admin']), (req, res) => controller.handleCompareProductPrices(req, res));
  router.post('/pricing/analyze', authMiddleware, requireRole(['admin']), (req, res) => controller.handleAnalyzeMarket(req, res));
  router.post('/pricing/dynamic-update', authMiddleware, requireRole(['admin']), (req, res) => controller.handleUpdateDynamicPrice(req, res));

  // Sync triggers
  router.post('/sync/full', authMiddleware, requireRole(['admin']), (req, res) => controller.handleTriggerFullSync(req, res));
  router.post('/sync/prices', authMiddleware, requireRole(['admin']), (req, res) => controller.handleTriggerPriceUpdate(req, res));

  // Providers
  router.get('/providers', authMiddleware, requireRole(['admin']), (req, res) => controller.handleListProviders(req, res));

  // Cleanup
  router.post('/cleanup', authMiddleware, requireRole(['admin']), (req, res) => controller.handleCleanup(req, res));

  return router;
}
