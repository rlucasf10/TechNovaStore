/**
 * Rutas del servicio de Auto-Purchase
 * 
 * Define todas las rutas HTTP del servicio.
 * Extrae la configuración de rutas del index.ts original.
 * 
 * SEGURIDAD: Este es un servicio CRÍTICO que maneja compras automáticas.
 * Todas las rutas de negocio requieren autenticación y rol admin.
 */

import { Router } from 'express';
import { AutoPurchaseController } from './AutoPurchaseController';
import { authMiddleware, requireRole } from '../shared/middleware/auth';

export function createRoutes(controller: AutoPurchaseController): Router {
  const router = Router();

  // ============================================
  // RUTAS PÚBLICAS (sin autenticación)
  // ============================================
  
  // Health check endpoint - público para monitoreo
  router.get('/health', (req, res) => controller.healthCheck(req, res));

  // ============================================
  // RUTAS PROTEGIDAS (requieren autenticación + rol admin)
  // ============================================
  
  // Provider selection endpoint - solo admins
  // Permite seleccionar proveedor para una compra
  router.post('/select-provider', authMiddleware, requireRole(['admin']), (req, res) => controller.selectProviderEndpoint(req, res));

  // Manual purchase trigger endpoint - solo admins
  // Permite ejecutar una compra manual (operación crítica)
  router.post('/purchase', authMiddleware, requireRole(['admin']), (req, res) => controller.purchaseEndpoint(req, res));

  // Get processing statistics - solo admins
  // Muestra estadísticas del sistema de compras
  router.get('/stats', authMiddleware, requireRole(['admin']), (req, res) => controller.statsEndpoint(req, res));

  // Process pending orders endpoint - solo admins
  // Procesa pedidos pendientes (operación crítica)
  router.post('/process-pending', authMiddleware, requireRole(['admin']), (req, res) => controller.processPendingEndpoint(req, res));

  return router;
}
