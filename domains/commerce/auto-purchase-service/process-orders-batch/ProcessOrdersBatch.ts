/**
 * Caso de Uso: Procesar Lote de Órdenes
 * 
 * Procesa múltiples órdenes concurrentemente respetando límites:
 * - Procesa órdenes en lotes según maxConcurrentPurchases
 * - Maneja errores individuales sin detener el lote
 * - Agrega delays entre lotes para no sobrecargar proveedores
 * - Retorna resultados de todas las órdenes procesadas
 * 
 * LÓGICA COMPLETA EXTRAÍDA DE: AutoPurchaseOrchestrator.processOrdersBatch()
 */

import { OrderForPurchase, PurchaseOrchestrationResult } from '../orchestrate-purchase/OrchestratePurchase';
import { logger } from '../shared/utils/logger';

export interface IOrchestratePurchase {
  execute(order: OrderForPurchase): Promise<PurchaseOrchestrationResult>;
}

export class ProcessOrdersBatch {
  constructor(
    private maxConcurrentPurchases: number,
    private orchestratePurchase: IOrchestratePurchase
  ) {}

  /**
   * Procesa múltiples órdenes en lotes
   * LÓGICA COMPLETA EXTRAÍDA DE: AutoPurchaseOrchestrator.processOrdersBatch()
   */
  async execute(orders: OrderForPurchase[]): Promise<PurchaseOrchestrationResult[]> {
    logger.info(`Processing batch of orders`, {
      orderCount: orders.length,
      maxConcurrent: this.maxConcurrentPurchases
    });

    const results: PurchaseOrchestrationResult[] = [];
    
    // Process orders in batches to respect concurrency limits
    for (let i = 0; i < orders.length; i += this.maxConcurrentPurchases) {
      const batch = orders.slice(i, i + this.maxConcurrentPurchases);
      
      const batchPromises = batch.map(order => 
        this.orchestratePurchase.execute(order).catch(error => ({
          success: false,
          order_id: order.id,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          processing_time_ms: 0
        }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to avoid overwhelming providers
      if (i + this.maxConcurrentPurchases < orders.length) {
        await this.sleep(1000);
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    logger.info(`Batch processing completed`, {
      totalOrders: orders.length,
      successfulOrders: successCount,
      failedOrders: orders.length - successCount
    });

    return results;
  }

  /**
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
