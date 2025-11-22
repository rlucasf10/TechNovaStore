/**
 * Caso de Uso: Colocar Orden con Proveedor
 * 
 * Coloca una orden con un proveedor específico con lógica de reintentos:
 * - Ejecuta la orden con el proveedor
 * - Maneja errores retryables vs no-retryables
 * - Implementa backoff exponencial para reintentos
 * - Soporta múltiples proveedores (Amazon, eBay, AliExpress, etc.)
 * 
 * Requirements: 2.1, 2.4 - Automatic order placement with retry mechanism
 */

import { PurchaseRequest } from '../execute-purchase/ExecutePurchase';
import { ProviderInfo } from '../shared/types/provider';
import { logger } from '../shared/utils/logger';

export interface ProviderOrderRequest {
  product_sku: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  shipping_address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  billing_address?: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  customer_info?: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface ProviderOrderResponse {
  success: boolean;
  provider_order_id?: string;
  confirmation_number?: string;
  tracking_number?: string;
  estimated_delivery?: Date;
  total_cost?: number;
  error_code?: string;
  error_message?: string;
  retry_after?: number; // seconds to wait before retry
}

export interface RetryConfig {
  max_attempts: number;
  initial_delay_ms: number;
  max_delay_ms: number;
  backoff_multiplier: number;
  retryable_errors: string[];
}

export class PlaceOrder {
  private readonly defaultRetryConfig: RetryConfig = {
    max_attempts: 3,
    initial_delay_ms: 1000,
    max_delay_ms: 30000,
    backoff_multiplier: 2,
    retryable_errors: [
      'RATE_LIMIT_EXCEEDED',
      'TEMPORARY_UNAVAILABLE',
      'NETWORK_ERROR',
      'TIMEOUT',
      'SERVER_ERROR'
    ]
  };

  /**
   * Coloca una orden con un proveedor específico con lógica de reintentos
   */
  async execute(
    provider: ProviderInfo,
    request: PurchaseRequest,
    retryConfig?: Partial<RetryConfig>
  ): Promise<ProviderOrderResponse> {
    return this.placeOrder(provider, request, retryConfig);
  }

  /**
   * Alias para compatibilidad con interfaces existentes
   */
  async placeOrder(
    provider: ProviderInfo,
    request: PurchaseRequest,
    retryConfig?: Partial<RetryConfig>
  ): Promise<ProviderOrderResponse> {
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < config.max_attempts) {
      attempt++;
      
      try {
        logger.info(`Placing order with provider (attempt ${attempt}/${config.max_attempts})`, {
          orderId: request.order_id,
          productSku: request.product_sku,
          provider: provider.name,
          attempt
        });

        const response = await this.executeProviderOrder(provider, request);
        
        if (response.success) {
          logger.info(`Order placed successfully`, {
            orderId: request.order_id,
            provider: provider.name,
            providerOrderId: response.provider_order_id,
            attempt
          });
          return response;
        }

        // Verificar si el error es retryable
        if (!this.isRetryableError(response.error_code, config.retryable_errors)) {
          logger.warn(`Non-retryable error from provider`, {
            orderId: request.order_id,
            provider: provider.name,
            errorCode: response.error_code,
            errorMessage: response.error_message
          });
          return response;
        }

        lastError = new Error(response.error_message || 'Provider order failed');
        
        // Esperar antes de reintentar si no es el último intento
        if (attempt < config.max_attempts) {
          const delay = this.calculateRetryDelay(attempt, config, response.retry_after);
          logger.info(`Retrying order placement`, {
            orderId: request.order_id,
            provider: provider.name,
            attempt,
            delay,
            nextAttempt: attempt + 1
          });
          await this.sleep(delay);
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        logger.error(`Error placing order (attempt ${attempt})`, {
          orderId: request.order_id,
          provider: provider.name,
          error: lastError.message,
          attempt
        });

        // Esperar antes de reintentar si no es el último intento
        if (attempt < config.max_attempts) {
          const delay = this.calculateRetryDelay(attempt, config);
          await this.sleep(delay);
        }
      }
    }

    // Todos los intentos fallaron
    logger.error(`All attempts failed for order placement`, {
      orderId: request.order_id,
      provider: provider.name,
      attempts: config.max_attempts,
      lastError: lastError?.message
    });

    return {
      success: false,
      error_code: 'MAX_RETRIES_EXCEEDED',
      error_message: `Failed after ${config.max_attempts} attempts: ${lastError?.message || 'Unknown error'}`
    };
  }

  /**
   * Ejecuta la llamada real a la API del proveedor
   */
  private async executeProviderOrder(
    provider: ProviderInfo,
    request: PurchaseRequest
  ): Promise<ProviderOrderResponse> {
    const providerRequest: ProviderOrderRequest = {
      product_sku: request.product_sku,
      product_name: `Product ${request.product_sku}`,
      quantity: request.quantity,
      unit_price: provider.price,
      shipping_address: request.shipping_address,
      billing_address: request.shipping_address,
    };

    // Enrutar a la implementación apropiada del proveedor
    switch (provider.name.toLowerCase()) {
      case 'amazon':
        return this.placeAmazonOrder(provider, providerRequest);
      case 'aliexpress':
        return this.placeAliExpressOrder(provider, providerRequest);
      case 'ebay':
        return this.placeEbayOrder(provider, providerRequest);
      case 'banggood':
        return this.placeBanggoodOrder(provider, providerRequest);
      case 'newegg':
        return this.placeNeweggOrder(provider, providerRequest);
      case 'local supplier':
        return this.placeLocalSupplierOrder(provider, providerRequest);
      default:
        return {
          success: false,
          error_code: 'UNSUPPORTED_PROVIDER',
          error_message: `Provider ${provider.name} is not supported`
        };
    }
  }

  /**
   * Implementación de orden para Amazon
   */
  private async placeAmazonOrder(
    provider: ProviderInfo,
    request: ProviderOrderRequest
  ): Promise<ProviderOrderResponse> {
    // Mock implementation - reemplazar con integración real de Amazon API
    await this.sleep(1);

    const random = Math.random();
    
    if (random < 0.85) { // 85% tasa de éxito
      return {
        success: true,
        provider_order_id: `AMZ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        confirmation_number: `CONF-${Date.now()}`,
        total_cost: provider.price * request.quantity + provider.shipping_cost,
        estimated_delivery: new Date(Date.now() + provider.delivery_time * 24 * 60 * 60 * 1000)
      };
    } else if (random < 0.95) { // 10% errores retryables
      const retryableErrors = [
        { code: 'RATE_LIMIT_EXCEEDED', message: 'API rate limit exceeded', retry_after: 1 },
        { code: 'TEMPORARY_UNAVAILABLE', message: 'Service temporarily unavailable' },
        { code: 'TIMEOUT', message: 'Request timeout' }
      ];
      const error = retryableErrors[Math.floor(Math.random() * retryableErrors.length)];
      
      return {
        success: false,
        error_code: error.code,
        error_message: error.message,
        retry_after: error.retry_after
      };
    } else { // 5% errores no-retryables
      const nonRetryableErrors = [
        { code: 'INSUFFICIENT_INVENTORY', message: 'Product out of stock' },
        { code: 'INVALID_ADDRESS', message: 'Shipping address not supported' },
        { code: 'PAYMENT_DECLINED', message: 'Payment method declined' }
      ];
      const error = nonRetryableErrors[Math.floor(Math.random() * nonRetryableErrors.length)];
      
      return {
        success: false,
        error_code: error.code,
        error_message: error.message
      };
    }
  }

  /**
   * Implementación de orden para AliExpress
   */
  private async placeAliExpressOrder(
    provider: ProviderInfo,
    request: ProviderOrderRequest
  ): Promise<ProviderOrderResponse> {
    await this.sleep(1);

    const random = Math.random();
    
    if (random < 0.75) {
      return {
        success: true,
        provider_order_id: `ALI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        confirmation_number: `ALI-CONF-${Date.now()}`,
        total_cost: provider.price * request.quantity + provider.shipping_cost,
        estimated_delivery: new Date(Date.now() + provider.delivery_time * 24 * 60 * 60 * 1000)
      };
    } else if (random < 0.90) {
      return {
        success: false,
        error_code: 'RATE_LIMIT_EXCEEDED',
        error_message: 'API rate limit exceeded',
        retry_after: 1
      };
    } else {
      return {
        success: false,
        error_code: 'INSUFFICIENT_INVENTORY',
        error_message: 'Product temporarily out of stock'
      };
    }
  }

  /**
   * Implementación de orden para eBay
   */
  private async placeEbayOrder(
    provider: ProviderInfo,
    request: ProviderOrderRequest
  ): Promise<ProviderOrderResponse> {
    await this.sleep(1);

    const random = Math.random();
    
    if (random < 0.80) {
      return {
        success: true,
        provider_order_id: `EBAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        confirmation_number: `EBAY-${Date.now()}`,
        total_cost: provider.price * request.quantity + provider.shipping_cost,
        estimated_delivery: new Date(Date.now() + provider.delivery_time * 24 * 60 * 60 * 1000)
      };
    } else {
      return {
        success: false,
        error_code: 'TEMPORARY_UNAVAILABLE',
        error_message: 'eBay service temporarily unavailable'
      };
    }
  }

  /**
   * Implementación de orden para Banggood
   */
  private async placeBanggoodOrder(
    provider: ProviderInfo,
    request: ProviderOrderRequest
  ): Promise<ProviderOrderResponse> {
    await this.sleep(1);

    const random = Math.random();
    
    if (random < 0.70) {
      return {
        success: true,
        provider_order_id: `BGD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        total_cost: provider.price * request.quantity + provider.shipping_cost,
        estimated_delivery: new Date(Date.now() + provider.delivery_time * 24 * 60 * 60 * 1000)
      };
    } else {
      return {
        success: false,
        error_code: 'NETWORK_ERROR',
        error_message: 'Network connection failed'
      };
    }
  }

  /**
   * Implementación de orden para Newegg
   */
  private async placeNeweggOrder(
    provider: ProviderInfo,
    request: ProviderOrderRequest
  ): Promise<ProviderOrderResponse> {
    await this.sleep(1);

    const random = Math.random();
    
    if (random < 0.88) {
      return {
        success: true,
        provider_order_id: `NWG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        confirmation_number: `NWG-CONF-${Date.now()}`,
        total_cost: provider.price * request.quantity + provider.shipping_cost,
        estimated_delivery: new Date(Date.now() + provider.delivery_time * 24 * 60 * 60 * 1000)
      };
    } else {
      return {
        success: false,
        error_code: 'SERVER_ERROR',
        error_message: 'Internal server error'
      };
    }
  }

  /**
   * Implementación de orden para proveedor local
   */
  private async placeLocalSupplierOrder(
    provider: ProviderInfo,
    request: ProviderOrderRequest
  ): Promise<ProviderOrderResponse> {
    await this.sleep(1);

    const random = Math.random();
    
    if (random < 0.92) {
      return {
        success: true,
        provider_order_id: `LOCAL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        confirmation_number: `LOCAL-CONF-${Date.now()}`,
        total_cost: provider.price * request.quantity + provider.shipping_cost,
        estimated_delivery: new Date(Date.now() + provider.delivery_time * 24 * 60 * 60 * 1000)
      };
    } else {
      return {
        success: false,
        error_code: 'INSUFFICIENT_INVENTORY',
        error_message: 'Product not available in local inventory'
      };
    }
  }

  /**
   * Verifica si un código de error es retryable
   */
  private isRetryableError(errorCode: string | undefined, retryableErrors: string[]): boolean {
    if (!errorCode) return false;
    return retryableErrors.includes(errorCode);
  }

  /**
   * Calcula el delay de reintento con backoff exponencial
   */
  private calculateRetryDelay(
    attempt: number,
    config: RetryConfig,
    retryAfter?: number
  ): number {
    // Usar retry_after del proveedor si está especificado
    if (retryAfter) {
      return Math.min(retryAfter * 1000, config.max_delay_ms);
    }

    // Backoff exponencial con jitter
    const baseDelay = config.initial_delay_ms * Math.pow(config.backoff_multiplier, attempt - 1);
    const jitter = Math.random() * 0.1 * baseDelay; // 10% jitter
    const delay = baseDelay + jitter;

    return Math.min(delay, config.max_delay_ms);
  }

  /**
   * Función de utilidad para sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
