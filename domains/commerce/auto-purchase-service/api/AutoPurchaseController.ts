/**
 * Controlador de Auto-Purchase
 * 
 * Maneja las peticiones HTTP para el servicio de auto-compra.
 * Extrae la lógica de los endpoints del index.ts original.
 */

import { Request, Response } from 'express';
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
   */
  async selectProviderEndpoint(req: Request, res: Response): Promise<void> {
    try {
      const { productSku, quantity, shippingAddress } = req.body;
      
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
        error: error instanceof Error ? error.message : 'Unknown error'
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
   */
  async purchaseEndpoint(req: Request, res: Response): Promise<void> {
    try {
      const order = req.body;
      
      if (!order || !order.id) {
        res.status(400).json({
          success: false,
          error: 'Invalid order data'
        });
        return;
      }
      
      const result = await this.orchestratePurchase.execute(order);
      
      res.json({
        success: result.success,
        data: result
      });
    } catch (error) {
      logger.error('Purchase endpoint error', {
        error: error instanceof Error ? error.message : 'Unknown error'
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
   */
  async statsEndpoint(req: Request, res: Response): Promise<void> {
    try {
      const stats = this.getProcessingStats();
      res.json(stats);
    } catch (error) {
      logger.error('Stats endpoint error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Process pending orders endpoint
   * POST /process-pending
   */
  async processPendingEndpoint(req: Request, res: Response): Promise<void> {
    try {
      const ordersResponse = await this.orderServiceClient.getOrdersForAutoPurchase();
      
      if (!ordersResponse.success) {
        res.status(500).json({
          success: false,
          error: ordersResponse.error || 'Failed to get orders'
        });
        return;
      }

      const orders = ordersResponse.data || [];
      const results = await this.processOrdersBatch.execute(orders);
      
      res.json({
        success: true,
        data: {
          processedOrders: results.length,
          successfulOrders: results.filter(r => r.success).length,
          failedOrders: results.filter(r => !r.success).length,
          results
        }
      });
    } catch (error) {
      logger.error('Process pending endpoint error', {
        error: error instanceof Error ? error.message : 'Unknown error'
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
