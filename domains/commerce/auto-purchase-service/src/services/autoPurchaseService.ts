import { Address } from '@technovastore/shared-types';
import { ProviderSelector } from './providerSelector';
import { ProviderSelection, ProviderInfo } from '../types/provider';
import { OrderPlacer, ProviderOrderResponse } from './orderPlacer';
import { logger } from '../utils/logger';

export interface PurchaseRequest {
  order_id: number;
  product_sku: string;
  quantity: number;
  shipping_address: Address;
  max_delivery_time?: number;
  preferred_providers?: string[];
}

export interface PurchaseResult {
  success: boolean;
  provider_used: string;
  provider_order_id?: string;
  total_cost: number;
  estimated_delivery: Date;
  error_message?: string;
  fallback_attempts?: number;
}

export class AutoPurchaseService {
  private orderPlacer: OrderPlacer;

  constructor(private providerSelector: ProviderSelector) {
    this.orderPlacer = new OrderPlacer();
  }

  /**
   * Executes automatic purchase with fallback mechanism
   * Requirements: 2.2, 2.3 - Auto purchase with fallback system
   */
  async executePurchase(request: PurchaseRequest): Promise<PurchaseResult> {
    try {
      // Select the best provider
      const selection = await this.providerSelector.selectBestProvider(
        request.product_sku,
        request.quantity,
        request.shipping_address,
        {
          max_delivery_time: request.max_delivery_time,
          preferred_providers: request.preferred_providers
        }
      );

      // Attempt purchase with primary provider
      let purchaseResult = await this.attemptPurchase(selection.provider, request);
      
      if (purchaseResult.success) {
        return {
          ...purchaseResult,
          total_cost: selection.total_cost,
          estimated_delivery: selection.estimated_delivery
        };
      }

      // If primary provider fails, try fallback providers
      let fallbackAttempts = 0;
      for (const fallbackProvider of selection.fallback_providers) {
        fallbackAttempts++;
        console.log(`Attempting fallback purchase with ${fallbackProvider.name} (attempt ${fallbackAttempts})`);
        
        purchaseResult = await this.attemptPurchase(fallbackProvider, request);
        
        if (purchaseResult.success) {
          // Recalculate cost for the fallback provider
          const fallbackSelection = await this.providerSelector.selectBestProvider(
            request.product_sku,
            request.quantity,
            request.shipping_address,
            { preferred_providers: [fallbackProvider.name.toLowerCase()] }
          );

          return {
            ...purchaseResult,
            total_cost: fallbackSelection.total_cost,
            estimated_delivery: fallbackSelection.estimated_delivery,
            fallback_attempts: fallbackAttempts
          };
        }
      }

      // All providers failed
      return {
        success: false,
        provider_used: 'none',
        total_cost: 0,
        estimated_delivery: new Date(),
        error_message: 'All providers failed to process the purchase',
        fallback_attempts: fallbackAttempts
      };

    } catch (error) {
      return {
        success: false,
        provider_used: 'none',
        total_cost: 0,
        estimated_delivery: new Date(),
        error_message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Attempts purchase with a specific provider using the OrderPlacer
   */
  private async attemptPurchase(
    provider: ProviderInfo,
    request: PurchaseRequest
  ): Promise<PurchaseResult> {
    try {
      logger.info(`Attempting purchase with ${provider.name}`, {
        orderId: request.order_id,
        productSku: request.product_sku,
        provider: provider.name
      });

      // Use the OrderPlacer for actual purchase
      const orderResponse = await this.orderPlacer.placeOrder(provider, request);
      
      if (orderResponse.success) {
        logger.info(`Purchase successful with ${provider.name}`, {
          orderId: request.order_id,
          providerOrderId: orderResponse.provider_order_id,
          totalCost: orderResponse.total_cost
        });

        return {
          success: true,
          provider_used: provider.name,
          provider_order_id: orderResponse.provider_order_id,
          total_cost: orderResponse.total_cost || 0,
          estimated_delivery: orderResponse.estimated_delivery || new Date(),
          error_message: undefined
        };
      } else {
        logger.warn(`Purchase failed with ${provider.name}`, {
          orderId: request.order_id,
          errorCode: orderResponse.error_code,
          errorMessage: orderResponse.error_message
        });

        return {
          success: false,
          provider_used: provider.name,
          provider_order_id: undefined,
          total_cost: 0,
          estimated_delivery: new Date(),
          error_message: orderResponse.error_message || 'Purchase failed'
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Purchase attempt failed';
      
      logger.error(`Purchase attempt error with ${provider.name}`, {
        orderId: request.order_id,
        provider: provider.name,
        error: errorMessage
      });

      return {
        success: false,
        provider_used: provider.name,
        provider_order_id: undefined,
        total_cost: 0,
        estimated_delivery: new Date(),
        error_message: errorMessage
      };
    }
  }



  /**
   * Gets purchase status from provider
   */
  async getPurchaseStatus(providerName: string, providerOrderId: string): Promise<{
    status: string;
    tracking_number?: string;
    estimated_delivery?: Date;
  }> {
    // Mock implementation
    const statuses = ['confirmed', 'processing', 'shipped', 'delivered'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      status: randomStatus,
      tracking_number: randomStatus === 'shipped' || randomStatus === 'delivered' 
        ? `TRK${Date.now()}` 
        : undefined,
      estimated_delivery: randomStatus !== 'delivered' 
        ? new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000) 
        : undefined
    };
  }

  /**
   * Cancels a purchase if possible
   */
  async cancelPurchase(providerName: string, providerOrderId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    // Mock implementation
    const canCancel = Math.random() > 0.3; // 70% chance of successful cancellation
    
    return {
      success: canCancel,
      message: canCancel 
        ? 'Purchase cancelled successfully' 
        : 'Cannot cancel - order already processed'
    };
  }
}