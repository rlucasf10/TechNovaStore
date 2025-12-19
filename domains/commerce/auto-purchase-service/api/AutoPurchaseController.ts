/**
 * Controlador de Auto-Purchase
 * 
 * Maneja las peticiones HTTP para el servicio de auto-compra.
 * Extrae la lógica de los endpoints del index.ts original.
 * 
 * SEGURIDAD: Este es un servicio CRÍTICO. Todas las operaciones
 * de negocio requieren autenticación y rol admin.
 * Se registra quién ejecuta cada operación para auditoría.
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@technovastore/shared-types';
import { logger } from '../shared/utils/logger';

// Interfaces para las dependencias
export interface IOrchestratePurchase {
  execute(order: any): Promise<any>;
  getActivePurchases(): Set<number>;
}

export interface ISelectProvider {
  execute(productSku: string, quantity: number, shippingAddress: any, criteria?: any): Promise<any>;
}

export interface IProcessOrdersBatch {
  execute(orders: any[]): Promise<any[]>;
}

export interface IOrderServiceClient {
  getOrdersForAutoPurchase(): Promise<{ success: boolean; data?: any[]; error?: string }>;
}

export interface ProcessingStats {
  activePurchases: number;
  maxConcurrent: number;
  enableConfirmationHandling: boolean;
}

export class AutoPurchaseController {
  constructor(
    private orchestratePurchase: IOrchestratePurchase,
    private selectProvider: ISelectProvider,
    private processOrdersBatch: IProcessOrdersBatch,
    private orderServiceClient: IOrderServiceClient,
    private maxConcurrentPurchases: number,
    private enableConfirmationHandling: boolean
  ) {}

  /**
   * Health check endpoint
   * GET /health
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const stats = this.getProcessingStats();
      res.json({ 
        status: 'healthy', 
        service: 'auto-purchase',
        stats
      });
    } catch (error) {
      logger.error('Health check error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(500).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Provider selection endpoint for testing
   * POST /select-provider
   * Requiere: autenticación + rol admin
   */
  async selectProviderEndpoint(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { productSku, quantity, shippingAddress } = req.body;
      const adminUser = req.user;
      
      // Loggear operación administrativa
      logger.info('Admin selecting provider', {
        adminId: adminUser?.id,
        adminRole: adminUser?.role,
        productSku,
        quantity,
        endpoint: '/select-provider',
      });
      
      if (!productSku || !quantity || !shippingAddress) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: productSku, quantity, shippingAddress'
        });
        return;
      }
      
      const selectedProvider = await this.selectProvider.execute(
        productSku,
        quantity,
        shippingAddress
      );
      
      res.json({
        success: true,
        data: selectedProvider
      });
    } catch (error) {
      logger.error('Provider selection error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        adminId: (req as AuthenticatedRequest).user?.id,
      });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Manual purchase trigger endpoint for testing
   * POST /purchase
   * Requiere: autenticación + rol admin
   * OPERACIÓN CRÍTICA: Ejecuta una compra manual
   */
  async purchaseEndpoint(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const order = req.body;
      const adminUser = req.user;
      
      if (!order || !order.id) {
        res.status(400).json({
          success: false,
          error: 'Invalid order data'
        });
        return;
      }
      
      // Loggear operación crítica de compra
      logger.info('Admin triggering manual purchase', {
        adminId: adminUser?.id,
        adminRole: adminUser?.role,
        orderId: order.id,
        orderUserId: order.user_id,
        endpoint: '/purchase',
        critical: true,
      });
      
      const result = await this.orchestratePurchase.execute(order);
      
      // Loggear resultado de la operación
      logger.info('Manual purchase completed', {
        adminId: adminUser?.id,
        orderId: order.id,
        success: result.success,
      });
      
      res.json({
        success: result.success,
        data: result
      });
    } catch (error) {
      logger.error('Purchase endpoint error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        adminId: (req as AuthenticatedRequest).user?.id,
        orderId: req.body?.id,
      });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get processing statistics
   * GET /stats
   * Requiere: autenticación + rol admin
   */
  async statsEndpoint(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminUser = req.user;
      
      // Loggear acceso a estadísticas
      logger.info('Admin accessing processing stats', {
        adminId: adminUser?.id,
        adminRole: adminUser?.role,
        endpoint: '/stats',
      });
      
      const stats = this.getProcessingStats();
      res.json(stats);
    } catch (error) {
      logger.error('Stats endpoint error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        adminId: (req as AuthenticatedRequest).user?.id,
      });
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Process pending orders endpoint
   * POST /process-pending
   * Requiere: autenticación + rol admin
   * OPERACIÓN CRÍTICA: Procesa múltiples pedidos pendientes
   */
  async processPendingEndpoint(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminUser = req.user;
      
      // Loggear inicio de operación crítica
      logger.info('Admin triggering batch processing of pending orders', {
        adminId: adminUser?.id,
        adminRole: adminUser?.role,
        endpoint: '/process-pending',
        critical: true,
      });
      
      const ordersResponse = await this.orderServiceClient.getOrdersForAutoPurchase();
      
      if (!ordersResponse.success) {
        res.status(500).json({
          success: false,
          error: ordersResponse.error || 'Failed to get orders'
        });
        return;
      }

      const orders = ordersResponse.data || [];
      
      logger.info('Processing pending orders batch', {
        adminId: adminUser?.id,
        ordersCount: orders.length,
      });
      
      const results = await this.processOrdersBatch.execute(orders);
      
      // Loggear resultado del procesamiento
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      logger.info('Batch processing completed', {
        adminId: adminUser?.id,
        processedOrders: results.length,
        successfulOrders: successCount,
        failedOrders: failCount,
      });
      
      res.json({
        success: true,
        data: {
          processedOrders: results.length,
          successfulOrders: successCount,
          failedOrders: failCount,
          results
        }
      });
    } catch (error) {
      logger.error('Process pending endpoint error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        adminId: (req as AuthenticatedRequest).user?.id,
      });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get processing statistics (helper method)
   */
  private getProcessingStats(): ProcessingStats {
    return {
      activePurchases: this.orchestratePurchase.getActivePurchases().size,
      maxConcurrent: this.maxConcurrentPurchases,
      enableConfirmationHandling: this.enableConfirmationHandling
    };
  }
}
