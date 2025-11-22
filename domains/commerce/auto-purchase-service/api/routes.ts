/**
 * Rutas del servicio de Auto-Purchase
 * 
 * Define todas las rutas HTTP del servicio.
 * Extrae la configuración de rutas del index.ts original.
 */

import { Router } from 'express';
import { AutoPurchaseController } from './AutoPurchaseController';

export function createRoutes(controller: AutoPurchaseController): Router {
  const router = Router();

  // Health check endpoint
  router.get('/health', (req, res) => controller.healthCheck(req, res));

  // Provider selection endpoint for testing
  router.post('/select-provider', (req, res) => controller.selectProviderEndpoint(req, res));

  // Manual purchase trigger endpoint for testing
  router.post('/purchase', (req, res) => controller.purchaseEndpoint(req, res));

  // Get processing statistics
  router.get('/stats', (req, res) => controller.statsEndpoint(req, res));

  // Process pending orders endpoint
  router.post('/process-pending', (req, res) => controller.processPendingEndpoint(req, res));

  return router;
}
