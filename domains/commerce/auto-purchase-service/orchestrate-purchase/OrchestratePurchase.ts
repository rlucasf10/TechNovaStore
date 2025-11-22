/**
 * Caso de Uso: Orquestar Compra Completa
 * 
 * Orquesta el proceso completo de auto-compra para una orden:
 * - Verifica que la orden no esté siendo procesada
 * - Marca la orden como "processing" en Order Service
 * - Procesa cada item de la orden
 * - Maneja confirmaciones de proveedor (si está habilitado)
 * - Actualiza Order Service con el resultado
 * - Maneja errores y fallbacks
 * 
 * Requirements: 2.1, 2.4, 2.5 - Complete auto-purchase orchestration
 * 
 * NOTA: Esta es la lógica COMPLETA extraída de AutoPurchaseOrchestrator
 * sin simplificaciones ni cambios.
 */

import { PurchaseRequest, PurchaseResult } from '../execute-purchase/ExecutePurchase';
import { ConfirmationStatus } from '../handle-confirmation/HandleConfirmation';
import { ProviderOrderResponse } from '../place-order/PlaceOrder';
import { logger } from '../shared/utils/logger';

export interface AutoPurchaseConfig {
  orderService: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    apiKey?: string;
  };
  enableConfirmationHandling: boolean;
  maxConcurrentPurchases: number;
  purchaseTimeoutMs: number;
}

export interface PurchaseOrchestrationResult {
  success: boolean;
  order_id: number;
  provider_used?: string;
  provider_order_id?: string;
  confirmation_status?: ConfirmationStatus;
  total_cost?: number;
  estimated_delivery?: Date;
  error_message?: string;
  fallback_attempts?: number;
  processing_time_ms: number;
}

export interface OrderForPurchase {
  id: number;
  user_id: number;
  order_number: string;
  total_amount: number;
  shipping_address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  items: Array<{
    product_sku: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
}

// Interfaces para las dependencias
export interface IExecutePurchase {
  execute(request: PurchaseRequest): Promise<PurchaseResult>;
}

export interface IHandleConfirmation {
  execute(provider: any, orderResponse: any, orderId: number): Promise<ConfirmationStatus>;
}

export interface IOrderServiceClient {
  markOrderAsProcessing(orderId: number): Promise<{ success: boolean; error?: string }>;
  reportAutoPurchaseSuccess(
    orderId: number,
    providerOrderId: string,
    providerName: string,
    totalCost: number,
    estimatedDelivery: Date
  ): Promise<{ success: boolean; error?: string }>;
  reportAutoPurchaseFailure(
    orderId: number,
    errorMessage: string,
    providerAttempts: string[]
  ): Promise<{ success: boolean; error?: string }>;
  updateOrderStatus(orderId: number, status: string): Promise<{ success: boolean; error?: string }>;
  updateTrackingInfo(
    orderId: number,
    trackingNumber: string,
    estimatedDelivery?: Date
  ): Promise<{ success: boolean; error?: string }>;
}

export class OrchestratePurchase {
  private activePurchases: Set<number> = new Set();

  constructor(
    private config: AutoPurchaseConfig,
    private executePurchase: IExecutePurchase,
    private handleConfirmation: IHandleConfirmation,
    private orderServiceClient: IOrderServiceClient
  ) {}

  /**
   * Orquesta el proceso completo de auto-compra para una orden
   * LÓGICA COMPLETA EXTRAÍDA DE: AutoPurchaseOrchestrator.orchestratePurchase()
   */
  async execute(order: OrderForPurchase): Promise<PurchaseOrchestrationResult> {
    const startTime = Date.now();
    
    // Check if order is already being processed
    if (this.activePurchases.has(order.id)) {
      return {
        success: false,
        order_id: order.id,
        error_message: 'Order is already being processed',
        processing_time_ms: Date.now() - startTime
      };
    }

    // Add to active purchases
    this.activePurchases.add(order.id);

    try {
      logger.info(`Starting auto-purchase orchestration`, {
        orderId: order.id,
        orderNumber: order.order_number,
        itemCount: order.items.length
      });

      // Mark order as processing in Order Service
      const markProcessingResult = await this.orderServiceClient.markOrderAsProcessing(order.id);
      if (!markProcessingResult.success) {
        logger.warn(`Failed to mark order as processing, continuing anyway`, {
          orderId: order.id,
          error: markProcessingResult.error
        });
      }

      // Process each item in the order
      const purchaseResults: PurchaseOrchestrationResult[] = [];
      
      for (const item of order.items) {
        const itemResult = await this.processSingleItem(order, item);
        purchaseResults.push(itemResult);
        
        // If any item fails, we might want to handle it differently
        // For now, we continue with other items
        if (!itemResult.success) {
          logger.warn(`Item purchase failed`, {
            orderId: order.id,
            productSku: item.product_sku,
            error: itemResult.error_message
          });
        }
      }

      // Determine overall success
      const successfulPurchases = purchaseResults.filter(r => r.success);
      const overallSuccess = successfulPurchases.length > 0;

      if (overallSuccess) {
        // Update order with successful purchase information
        const firstSuccessful = successfulPurchases[0];
        
        await this.orderServiceClient.reportAutoPurchaseSuccess(
          order.id,
          firstSuccessful.provider_order_id!,
          firstSuccessful.provider_used!,
          firstSuccessful.total_cost!,
          firstSuccessful.estimated_delivery!
        );

        // Update order status to processing/shipped based on confirmation
        const newStatus = firstSuccessful.confirmation_status?.status === 'shipped' ? 'shipped' : 'processing';
        await this.orderServiceClient.updateOrderStatus(order.id, newStatus);

        logger.info(`Auto-purchase orchestration completed successfully`, {
          orderId: order.id,
          successfulItems: successfulPurchases.length,
          totalItems: order.items.length,
          processingTimeMs: Date.now() - startTime
        });

        return {
          success: true,
          order_id: order.id,
          provider_used: firstSuccessful.provider_used,
          provider_order_id: firstSuccessful.provider_order_id,
          confirmation_status: firstSuccessful.confirmation_status,
          total_cost: firstSuccessful.total_cost,
          estimated_delivery: firstSuccessful.estimated_delivery,
          fallback_attempts: firstSuccessful.fallback_attempts,
          processing_time_ms: Date.now() - startTime
        };
      } else {
        // All items failed
        const failedProviders = purchaseResults
          .filter(r => r.provider_used)
          .map(r => r.provider_used!);

        await this.orderServiceClient.reportAutoPurchaseFailure(
          order.id,
          'All items failed to purchase',
          failedProviders
        );

        // Update order status to cancelled or failed
        await this.orderServiceClient.updateOrderStatus(order.id, 'cancelled');

        logger.error(`Auto-purchase orchestration failed for all items`, {
          orderId: order.id,
          failedItems: purchaseResults.length,
          processingTimeMs: Date.now() - startTime
        });

        return {
          success: false,
          order_id: order.id,
          error_message: 'All items failed to purchase',
          processing_time_ms: Date.now() - startTime
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error(`Auto-purchase orchestration error`, {
        orderId: order.id,
        error: errorMessage,
        processingTimeMs: Date.now() - startTime
      });

      // Report failure to Order Service
      await this.orderServiceClient.reportAutoPurchaseFailure(
        order.id,
        errorMessage,
        []
      );

      return {
        success: false,
        order_id: order.id,
        error_message: errorMessage,
        processing_time_ms: Date.now() - startTime
      };
    } finally {
      // Remove from active purchases
      this.activePurchases.delete(order.id);
    }
  }

  /**
   * Procesa la compra de un solo item
   * LÓGICA COMPLETA EXTRAÍDA DE: AutoPurchaseOrchestrator.processSingleItem()
   */
  private async processSingleItem(
    order: OrderForPurchase,
    item: { product_sku: string; product_name: string; quantity: number; unit_price: number }
  ): Promise<PurchaseOrchestrationResult> {
    const startTime = Date.now();

    try {
      // Create purchase request
      const purchaseRequest: PurchaseRequest = {
        order_id: order.id,
        product_sku: item.product_sku,
        quantity: item.quantity,
        shipping_address: order.shipping_address
      };

      // Execute purchase with fallback
      const purchaseResult = await this.executePurchase.execute(purchaseRequest);

      if (!purchaseResult.success) {
        return {
          success: false,
          order_id: order.id,
          error_message: purchaseResult.error_message,
          fallback_attempts: purchaseResult.fallback_attempts,
          processing_time_ms: Date.now() - startTime
        };
      }

      logger.info(`Item purchase successful, starting confirmation handling`, {
        orderId: order.id,
        productSku: item.product_sku,
        provider: purchaseResult.provider_used,
        providerOrderId: purchaseResult.provider_order_id
      });

      let confirmationStatus: ConfirmationStatus | undefined;

      // Handle confirmation if enabled
      if (this.config.enableConfirmationHandling && purchaseResult.provider_order_id) {
        try {
          // This is a mock provider info - in real implementation, get from provider selector
          const mockProvider = {
            name: purchaseResult.provider_used,
            price: item.unit_price,
            availability: true,
            shipping_cost: 0,
            delivery_time: 7,
            last_updated: new Date(),
            reliability_score: 85
          };

          const mockOrderResponse: ProviderOrderResponse = {
            success: true,
            provider_order_id: purchaseResult.provider_order_id,
            total_cost: purchaseResult.total_cost,
            estimated_delivery: purchaseResult.estimated_delivery
          };

          confirmationStatus = await this.handleConfirmation.execute(
            mockProvider,
            mockOrderResponse,
            order.id
          );

          logger.info(`Confirmation handling completed`, {
            orderId: order.id,
            productSku: item.product_sku,
            confirmationStatus: confirmationStatus.status
          });

          // Update Order Service with confirmation status
          if (confirmationStatus.tracking_number) {
            await this.orderServiceClient.updateTrackingInfo(
              order.id,
              confirmationStatus.tracking_number,
              confirmationStatus.estimated_delivery
            );
          }

        } catch (confirmationError) {
          logger.warn(`Confirmation handling failed, but purchase was successful`, {
            orderId: order.id,
            productSku: item.product_sku,
            error: confirmationError instanceof Error ? confirmationError.message : 'Unknown error'
          });
          
          // Don't fail the entire purchase due to confirmation issues
          confirmationStatus = {
            provider_order_id: purchaseResult.provider_order_id!,
            status: 'failed',
            error_message: 'Confirmation handling failed',
            last_updated: new Date(),
            retry_count: 0
          };
        }
      }

      return {
        success: true,
        order_id: order.id,
        provider_used: purchaseResult.provider_used,
        provider_order_id: purchaseResult.provider_order_id,
        confirmation_status: confirmationStatus,
        total_cost: purchaseResult.total_cost,
        estimated_delivery: purchaseResult.estimated_delivery,
        fallback_attempts: purchaseResult.fallback_attempts,
        processing_time_ms: Date.now() - startTime
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error(`Single item processing error`, {
        orderId: order.id,
        productSku: item.product_sku,
        error: errorMessage
      });

      return {
        success: false,
        order_id: order.id,
        error_message: errorMessage,
        processing_time_ms: Date.now() - startTime
      };
    }
  }

  /**
   * Obtiene el conjunto de compras activas (para GetProcessingStats)
   */
  getActivePurchases(): Set<number> {
    return this.activePurchases;
  }
}
