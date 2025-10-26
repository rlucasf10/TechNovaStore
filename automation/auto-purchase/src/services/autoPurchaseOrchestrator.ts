import { AutoPurchaseService, PurchaseRequest, PurchaseResult } from './autoPurchaseService';
import { OrderPlacer, ProviderOrderResponse } from './orderPlacer';
import { ConfirmationHandler, ConfirmationStatus } from './confirmationHandler';
import { OrderServiceClient, OrderServiceConfig, OrderUpdateData } from './orderServiceClient';
import { MockOrderServiceClient } from './__mocks__/orderServiceClient';
import { ProviderSelector } from './providerSelector';
import { logger } from '../utils/logger';
import { TEST_CONFIG } from '../config/test';

export interface AutoPurchaseConfig {
  orderService: OrderServiceConfig;
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

export class AutoPurchaseOrchestrator {
  private autoPurchaseService: AutoPurchaseService;
  private orderPlacer: OrderPlacer;
  private confirmationHandler: ConfirmationHandler;
  private orderServiceClient: OrderServiceClient;
  private config: AutoPurchaseConfig;
  private activePurchases: Set<number> = new Set();

  constructor(config: AutoPurchaseConfig) {
    this.config = {
      ...config,
      enableConfirmationHandling: TEST_CONFIG.DISABLE_ORDER_SERVICE ? false : config.enableConfirmationHandling,
      purchaseTimeoutMs: TEST_CONFIG.PURCHASE_TIMEOUT_MS
    };
    
    // Initialize services
    const providerSelector = new ProviderSelector();
    this.autoPurchaseService = new AutoPurchaseService(providerSelector);
    this.orderPlacer = new OrderPlacer();
    this.confirmationHandler = new ConfirmationHandler();
    
    // Use mock client during tests
    this.orderServiceClient = TEST_CONFIG.DISABLE_ORDER_SERVICE 
      ? new MockOrderServiceClient() 
      : new OrderServiceClient(config.orderService);
  }

  /**
   * Orchestrates the complete auto-purchase process for a single order
   * Requirements: 2.1, 2.4, 2.5 - Complete auto-purchase orchestration
   */
  async orchestratePurchase(order: OrderForPurchase): Promise<PurchaseOrchestrationResult> {
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
   * Processes a single item purchase
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
      const purchaseResult = await this.autoPurchaseService.executePurchase(purchaseRequest);

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

          confirmationStatus = await this.confirmationHandler.handleConfirmation(
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
   * Processes multiple orders concurrently
   */
  async processOrdersBatch(orders: OrderForPurchase[]): Promise<PurchaseOrchestrationResult[]> {
    logger.info(`Processing batch of orders`, {
      orderCount: orders.length,
      maxConcurrent: this.config.maxConcurrentPurchases
    });

    const results: PurchaseOrchestrationResult[] = [];
    
    // Process orders in batches to respect concurrency limits
    for (let i = 0; i < orders.length; i += this.config.maxConcurrentPurchases) {
      const batch = orders.slice(i, i + this.config.maxConcurrentPurchases);
      
      const batchPromises = batch.map(order => 
        this.orchestratePurchase(order).catch(error => ({
          success: false,
          order_id: order.id,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          processing_time_ms: 0
        }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to avoid overwhelming providers
      if (i + this.config.maxConcurrentPurchases < orders.length) {
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
   * Gets orders ready for auto-purchase from Order Service
   */
  async getOrdersForProcessing(): Promise<OrderForPurchase[]> {
    try {
      const response = await this.orderServiceClient.getOrdersForAutoPurchase();
      
      if (!response.success) {
        logger.error(`Failed to get orders for processing`, {
          error: response.error
        });
        return [];
      }

      const orders = response.data || [];
      
      logger.info(`Retrieved orders for processing`, {
        orderCount: orders.length
      });

      return orders;
    } catch (error) {
      logger.error(`Error getting orders for processing`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Main processing loop for continuous auto-purchase
   */
  async startProcessingLoop(intervalMs: number = 60000): Promise<void> {
    logger.info(`Starting auto-purchase processing loop`, {
      intervalMs,
      maxConcurrent: this.config.maxConcurrentPurchases
    });

    const processOrders = async () => {
      try {
        // Check Order Service health
        const healthCheck = await this.orderServiceClient.healthCheck();
        if (!healthCheck.success) {
          logger.warn(`Order Service health check failed`, {
            error: healthCheck.error
          });
          return;
        }

        // Get orders ready for processing
        const orders = await this.getOrdersForProcessing();
        
        if (orders.length === 0) {
          logger.debug(`No orders ready for processing`);
          return;
        }

        // Process orders
        const results = await this.processOrdersBatch(orders);
        
        // Log summary
        const successCount = results.filter(r => r.success).length;
        logger.info(`Processing cycle completed`, {
          processedOrders: results.length,
          successfulOrders: successCount,
          failedOrders: results.length - successCount
        });

      } catch (error) {
        logger.error(`Error in processing loop`, {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    // Initial processing
    await processOrders();

    // Set up interval
    setInterval(processOrders, intervalMs);
  }

  /**
   * Gets current processing statistics
   */
  getProcessingStats(): {
    activePurchases: number;
    maxConcurrent: number;
    enableConfirmationHandling: boolean;
  } {
    return {
      activePurchases: this.activePurchases.size,
      maxConcurrent: this.config.maxConcurrentPurchases,
      enableConfirmationHandling: this.config.enableConfirmationHandling
    };
  }

  /**
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}