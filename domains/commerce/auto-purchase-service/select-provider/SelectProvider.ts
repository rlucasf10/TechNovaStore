/**
 * Caso de Uso: Seleccionar Mejor Proveedor
 * 
 * Selecciona el mejor proveedor basándose en múltiples criterios:
 * - Precio total (incluyendo envío, impuestos, fees)
 * - Tiempo de entrega
 * - Confiabilidad del proveedor
 * - Disponibilidad del producto
 * - Preferencias del usuario
 * 
 * Requirements: 2.2, 2.3 - Provider selection with scoring system
 */

import { Address } from '@technovastore/shared-types';
import { 
  ProviderInfo, 
  ProviderSelection, 
  CostCalculation, 
  ProviderAvailability,
  SelectionCriteria,
  ProviderName,
  ProviderConfig
} from '../shared/types/provider';
import { 
  PROVIDER_CONFIGS, 
  DEFAULT_SELECTION_WEIGHTS, 
  MAX_DELIVERY_DAYS,
  MIN_RELIABILITY_SCORE,
  FALLBACK_PROVIDER_COUNT 
} from '../shared/config/providers';
import { logger } from '../shared/utils/logger';

// Interfaces para las dependencias
export interface ICostCalculator {
  calculateTotalCost(
    provider: ProviderInfo,
    quantity: number,
    shippingAddress: Address
  ): Promise<CostCalculation>;
}

export interface IProviderAvailabilityChecker {
  checkAvailability(
    providerName: any, // ProviderName type
    productSku: string,
    quantity: number
  ): Promise<ProviderAvailability>;
}

export class SelectProvider {
  constructor(
    private costCalculator: ICostCalculator,
    private availabilityChecker: IProviderAvailabilityChecker
  ) {}

  /**
   * Selecciona el mejor proveedor basándose en múltiples criterios
   */
  async execute(
    productSku: string,
    quantity: number,
    shippingAddress: Address,
    criteria?: Partial<SelectionCriteria>
  ): Promise<ProviderSelection> {
    return this.selectBestProvider(productSku, quantity, shippingAddress, criteria);
  }

  /**
   * Alias para compatibilidad con interfaces existentes
   */
  async selectBestProvider(
    productSku: string,
    quantity: number,
    shippingAddress: Address,
    criteria?: Partial<SelectionCriteria>
  ): Promise<ProviderSelection> {
    const selectionCriteria: SelectionCriteria = {
      product_sku: productSku,
      quantity,
      shipping_address: shippingAddress,
      max_delivery_time: criteria?.max_delivery_time || MAX_DELIVERY_DAYS,
      preferred_providers: criteria?.preferred_providers || [],
      exclude_providers: criteria?.exclude_providers || []
    };

    // Obtener proveedores disponibles para el producto
    const availableProviders = await this.getAvailableProviders(selectionCriteria);
    
    if (availableProviders.length === 0) {
      throw new Error(`No available providers found for product ${productSku}`);
    }

    // Calcular puntuaciones para cada proveedor
    const scoredProviders = await this.scoreProviders(availableProviders, selectionCriteria);
    
    // Ordenar por puntuación (mayor primero)
    scoredProviders.sort((a, b) => b.score - a.score);

    const bestProvider = scoredProviders[0];
    const fallbackProviders = scoredProviders
      .slice(1, FALLBACK_PROVIDER_COUNT + 1)
      .map(sp => sp.provider);

    // Calcular costo total para el mejor proveedor
    const costCalculation = await this.costCalculator.calculateTotalCost(
      bestProvider.provider,
      quantity,
      shippingAddress
    );

    const estimatedDelivery = this.calculateEstimatedDelivery(bestProvider.provider.delivery_time);

    return {
      provider: bestProvider.provider,
      total_cost: costCalculation.total_cost,
      estimated_delivery: estimatedDelivery,
      confidence_score: bestProvider.score,
      fallback_providers: fallbackProviders
    };
  }

  /**
   * Obtiene proveedores disponibles para un producto específico
   */
  private async getAvailableProviders(criteria: SelectionCriteria): Promise<ProviderInfo[]> {
    const allProviders = Object.values(PROVIDER_CONFIGS);
    const availableProviders: ProviderInfo[] = [];

    for (const config of allProviders) {
      // Saltar proveedores excluidos
      if (criteria.exclude_providers?.includes(config.name)) {
        continue;
      }

      // Verificar si el proveedor soporta el país de envío
      if (!config.supported_countries.includes(criteria.shipping_address.country)) {
        continue;
      }

      try {
        // Verificar disponibilidad del proveedor
        const availability = await this.availabilityChecker.checkAvailability(
          config.name,
          criteria.product_sku,
          criteria.quantity
        );

        if (availability.is_available) {
          // Mock provider data - en implementación real vendría del sync engine
          const providerInfo: ProviderInfo = {
            name: config.display_name,
            price: this.getMockPrice(config.name, criteria.product_sku),
            availability: true,
            shipping_cost: this.getMockShippingCost(config.name, criteria.shipping_address),
            delivery_time: this.getMockDeliveryTime(config.name, criteria.shipping_address),
            last_updated: new Date(),
            reliability_score: this.getMockReliabilityScore(config.name),
            api_endpoint: config.base_url,
            api_key: config.api_key
          };

          // Filtrar por puntuación de confiabilidad
          if (providerInfo.reliability_score >= MIN_RELIABILITY_SCORE) {
            availableProviders.push(providerInfo);
          }
        }
      } catch (error) {
        logger.warn('Failed to check availability for provider', { 
          provider: config.name, 
          error: error instanceof Error ? error.message : error 
        });
        // Continuar con otros proveedores
      }
    }

    return availableProviders;
  }

  /**
   * Calcula puntuaciones para los proveedores
   */
  private async scoreProviders(
    providers: ProviderInfo[],
    criteria: SelectionCriteria
  ): Promise<Array<{ provider: ProviderInfo; score: number }>> {
    const scoredProviders: Array<{ provider: ProviderInfo; score: number }> = [];

    for (const provider of providers) {
      const costCalculation = await this.costCalculator.calculateTotalCost(
        provider,
        criteria.quantity,
        criteria.shipping_address
      );

      const score = this.calculateProviderScore(provider, costCalculation, criteria);
      scoredProviders.push({ provider, score });
    }

    return scoredProviders;
  }

  /**
   * Calcula una puntuación compuesta para un proveedor
   */
  private calculateProviderScore(
    provider: ProviderInfo,
    costCalculation: CostCalculation,
    criteria: SelectionCriteria
  ): number {
    const weights = DEFAULT_SELECTION_WEIGHTS;

    // Normalizar puntuaciones (0-100)
    const priceScore = this.calculatePriceScore(costCalculation.total_cost, provider);
    const deliveryScore = this.calculateDeliveryScore(provider.delivery_time, criteria.max_delivery_time || MAX_DELIVERY_DAYS);
    const reliabilityScore = provider.reliability_score;
    const availabilityScore = provider.availability ? 100 : 0;

    // Aplicar bonus de proveedor preferido
    let preferredBonus = 0;
    if (criteria.preferred_providers?.includes(provider.name.toLowerCase())) {
      preferredBonus = 10;
    }

    const compositeScore = 
      (priceScore * weights.price) +
      (deliveryScore * weights.delivery_time) +
      (reliabilityScore * weights.reliability) +
      (availabilityScore * weights.availability) +
      preferredBonus;

    return Math.min(100, Math.max(0, compositeScore));
  }

  /**
   * Calcula puntuación de precio (precio menor = puntuación mayor)
   */
  private calculatePriceScore(totalCost: number, provider: ProviderInfo): number {
    // Esto típicamente compararía contra otros proveedores o promedio del mercado
    // Por ahora, usando una relación inversa simple
    const maxReasonablePrice = 1000; // Debería ser dinámico basado en categoría de producto
    return Math.max(0, 100 - (totalCost / maxReasonablePrice) * 100);
  }

  /**
   * Calcula puntuación de entrega (entrega más rápida = puntuación mayor)
   */
  private calculateDeliveryScore(deliveryTime: number, maxDeliveryTime: number): number {
    if (deliveryTime > maxDeliveryTime) {
      return 0;
    }
    return Math.max(0, 100 - (deliveryTime / maxDeliveryTime) * 100);
  }

  /**
   * Calcula fecha estimada de entrega
   */
  private calculateEstimatedDelivery(deliveryDays: number): Date {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
    return deliveryDate;
  }

  // Métodos mock - serían reemplazados con datos reales del sync engine
  private getMockPrice(providerName: string, productSku: string): number {
    const basePrices: Record<string, number> = {
      amazon: 100,
      aliexpress: 80,
      ebay: 95,
      banggood: 75,
      newegg: 110,
      local: 120
    };
    return basePrices[providerName] || 100;
  }

  private getMockShippingCost(providerName: string, address: Address): number {
    const shippingCosts: Record<string, number> = {
      amazon: address.country === 'ES' ? 5 : 15,
      aliexpress: address.country === 'ES' ? 0 : 10,
      ebay: address.country === 'ES' ? 8 : 20,
      banggood: address.country === 'ES' ? 0 : 12,
      newegg: address.country === 'ES' ? 10 : 25,
      local: address.country === 'ES' ? 3 : 50
    };
    return shippingCosts[providerName] || 10;
  }

  private getMockDeliveryTime(providerName: string, address: Address): number {
    const deliveryTimes: Record<string, number> = {
      amazon: address.country === 'ES' ? 2 : 5,
      aliexpress: address.country === 'ES' ? 15 : 20,
      ebay: address.country === 'ES' ? 3 : 7,
      banggood: address.country === 'ES' ? 12 : 18,
      newegg: address.country === 'ES' ? 4 : 8,
      local: address.country === 'ES' ? 1 : 10
    };
    return deliveryTimes[providerName] || 7;
  }

  private getMockReliabilityScore(providerName: string): number {
    const reliabilityScores: Record<string, number> = {
      amazon: 95,
      aliexpress: 70,
      ebay: 80,
      banggood: 65,
      newegg: 85,
      local: 90
    };
    return reliabilityScores[providerName] || 75;
  }
}
