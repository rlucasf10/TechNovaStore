/**
 * Caso de Uso: Ejecutar Compra Automática
 * 
 * Ejecuta una compra automática con sistema de fallback:
 * - Selecciona el mejor proveedor
 * - Intenta la compra con el proveedor principal
 * - Si falla, intenta con proveedores de respaldo
 * - Retorna el resultado de la compra
 * 
 * Requirements: 2.2, 2.3 - Auto purchase with fallback system
 */

import { Address } from '@technovastore/shared-types';
import { ProviderInfo } from '../shared/types/provider';
import { logger } from '../shared/utils/logger';

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

// Interfaces para las dependencias
export interface IProviderSelector {
  selectBestProvider(
    productSku: string,
    quantity: number,
    shippingAddress: Address,
    criteria?: {
      max_delivery_time?: number;
      preferred_providers?: string[];
    }
  ): Promise<{
    provider: ProviderInfo;
    total_cost: number;
    estimated_delivery: Date;
    confidence_score: number;
    fallback_providers: ProviderInfo[];
  }>;
}

export interface IOrderPlacer {
  placeOrder(
    provider: ProviderInfo,
    request: PurchaseRequest
  ): Promise<{
    success: boolean;
    provider_order_id?: string;
    total_cost?: number;
    estimated_delivery?: Date;
    error_code?: string;
    error_message?: string;
  }>;
}

export class ExecutePurchase {
  constructor(
    private providerSelector: IProviderSelector,
    private orderPlacer: IOrderPlacer
  ) {}

  /**
   * Ejecuta la compra automática con sistema de fallback
   */
  async execute(request: PurchaseRequest): Promise<PurchaseResult> {
    try {
      logger.info('Starting automatic purchase execution', {
        orderId: request.order_id,
        productSku: request.product_sku,
        quantity: request.quantity
      });

      // Seleccionar el mejor proveedor
      const selection = await this.providerSelector.selectBestProvider(
        request.product_sku,
        request.quantity,
        request.shipping_address,
        {
          max_delivery_time: request.max_delivery_time,
          preferred_providers: request.preferred_providers
        }
      );

      logger.info('Provider selected', {
        orderId: request.order_id,
        provider: selection.provider.name,
        totalCost: selection.total_cost,
        fallbackCount: selection.fallback_providers.length
      });

      // Intentar compra con proveedor principal
      let purchaseResult = await this.attemptPurchase(selection.provider, request);
      
      if (purchaseResult.success) {
        logger.info('Purchase successful with primary provider', {
          orderId: request.order_id,
          provider: selection.provider.name,
          providerOrderId: purchaseResult.provider_order_id
        });

        return {
          ...purchaseResult,
          total_cost: selection.total_cost,
          estimated_delivery: selection.estimated_delivery
        };
      }

      logger.warn('Primary provider failed, trying fallback providers', {
        orderId: request.order_id,
        primaryProvider: selection.provider.name,
        fallbackCount: selection.fallback_providers.length
      });

      // Si el proveedor principal falla, intentar con proveedores de respaldo
      let fallbackAttempts = 0;
      for (const fallbackProvider of selection.fallback_providers) {
        fallbackAttempts++;
        
        logger.info(`Attempting fallback purchase`, {
          orderId: request.order_id,
          provider: fallbackProvider.name,
          attempt: fallbackAttempts
        });
        
        purchaseResult = await this.attemptPurchase(fallbackProvider, request);
        
        if (purchaseResult.success) {
          // Recalcular costo para el proveedor de respaldo
          const fallbackSelection = await this.providerSelector.selectBestProvider(
            request.product_sku,
            request.quantity,
            request.shipping_address,
            { preferred_providers: [fallbackProvider.name.toLowerCase()] }
          );

          logger.info('Purchase successful with fallback provider', {
            orderId: request.order_id,
            provider: fallbackProvider.name,
            attempt: fallbackAttempts,
            providerOrderId: purchaseResult.provider_order_id
          });

          return {
            ...purchaseResult,
            total_cost: fallbackSelection.total_cost,
            estimated_delivery: fallbackSelection.estimated_delivery,
            fallback_attempts: fallbackAttempts
          };
        }
      }

      // Todos los proveedores fallaron
      logger.error('All providers failed to process the purchase', {
        orderId: request.order_id,
        totalAttempts: fallbackAttempts + 1
      });

      return {
        success: false,
        provider_used: 'none',
        total_cost: 0,
        estimated_delivery: new Date(),
        error_message: 'All providers failed to process the purchase',
        fallback_attempts: fallbackAttempts
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      logger.error('Purchase execution error', {
        orderId: request.order_id,
        error: errorMessage
      });

      return {
        success: false,
        provider_used: 'none',
        total_cost: 0,
        estimated_delivery: new Date(),
        error_message: errorMessage
      };
    }
  }

  /**
   * Intenta realizar la compra con un proveedor específico
   */
  private async attemptPurchase(
    provider: ProviderInfo,
    request: PurchaseRequest
  ): Promise<PurchaseResult> {
    try {
      logger.info(`Attempting purchase with provider`, {
        orderId: request.order_id,
        productSku: request.product_sku,
        provider: provider.name
      });

      // Usar el OrderPlacer para la compra real
      const orderResponse = await this.orderPlacer.placeOrder(provider, request);
      
      if (orderResponse.success) {
        logger.info(`Purchase successful`, {
          orderId: request.order_id,
          provider: provider.name,
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
        logger.warn(`Purchase failed`, {
          orderId: request.order_id,
          provider: provider.name,
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
      
      logger.error(`Purchase attempt error`, {
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
}
