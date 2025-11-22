/**
 * Rutas del Sync Engine
 */

import express, { Router } from 'express';
import { SyncEngineController } from './SyncEngineController';

export function createRoutes(controller: SyncEngineController): Router {
  const router = express.Router();

  // Health check
  router.get('/health', (req, res) => controller.handleHealthCheck(req, res));

  // Status and metrics
  router.get('/status', (req, res) => controller.handleGetStatus(req, res));
  router.get('/metrics', (req, res) => controller.handleGetMetrics(req, res));

  // Cache
  router.get('/cache/stats', (req, res) => controller.handleGetCacheStats(req, res));

  // Pricing
  router.get('/pricing/alerts', (req, res) => controller.handleGetPricingAlerts(req, res));
  router.post('/pricing/compare', (req, res) => controller.handleCompareProductPrices(req, res));
  router.post('/pricing/analyze', (req, res) => controller.handleAnalyzeMarket(req, res));
  router.post('/pricing/dynamic-update', (req, res) => controller.handleUpdateDynamicPrice(req, res));

  // Sync triggers
  router.post('/sync/full', (req, res) => controller.handleTriggerFullSync(req, res));
  router.post('/sync/prices', (req, res) => controller.handleTriggerPriceUpdate(req, res));

  // Providers
  router.get('/providers', (req, res) => controller.handleListProviders(req, res));

  // Cleanup
  router.post('/cleanup', (req, res) => controller.handleCleanup(req, res));

  return router;
}
