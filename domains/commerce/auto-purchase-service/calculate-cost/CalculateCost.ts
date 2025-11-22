/**
 * Caso de Uso: Calcular Costo Total
 * 
 * Calcula el costo total de una compra incluyendo:
 * - Precio base del producto
 * - Costo de envío (con ajustes por cantidad y distancia)
 * - Impuestos (basados en el país de destino)
 * - Fees de procesamiento (basados en el proveedor)
 * 
 * Requirements: 2.2 - Calculate total costs including shipping
 */

import { Address } from '@technovastore/shared-types';
import { ProviderInfo, CostCalculation } from '../shared/types/provider';

export class CalculateCost {
  private readonly TAX_RATES: Record<string, number> = {
    'ES': 0.21, // IVA España
    'FR': 0.20, // IVA Francia
    'DE': 0.19, // IVA Alemania
    'IT': 0.22, // IVA Italia
    'PT': 0.23, // IVA Portugal
    'US': 0.08, // Impuesto promedio US
    'UK': 0.20  // IVA UK
  };

  private readonly PROCESSING_FEES: Record<string, number> = {
    'Amazon': 0.02,      // 2% fee de procesamiento
    'AliExpress': 0.03,  // 3% fee de procesamiento
    'eBay': 0.025,       // 2.5% fee de procesamiento
    'Banggood': 0.03,    // 3% fee de procesamiento
    'Newegg': 0.02,      // 2% fee de procesamiento
    'Local Supplier': 0.01 // 1% fee de procesamiento
  };

  /**
   * Calcula el costo total incluyendo todos los fees e impuestos
   */
  async execute(
    provider: ProviderInfo,
    quantity: number,
    shippingAddress: Address
  ): Promise<CostCalculation> {
    return this.calculateTotalCost(provider, quantity, shippingAddress);
  }

  /**
   * Alias para compatibilidad con interfaces existentes
   */
  async calculateTotalCost(
    provider: ProviderInfo,
    quantity: number,
    shippingAddress: Address
  ): Promise<CostCalculation> {
    const basePrice = provider.price * quantity;
    const shippingCost = this.calculateShippingCost(provider, quantity, shippingAddress);
    const taxes = this.calculateTaxes(basePrice + shippingCost, shippingAddress.country);
    const fees = this.calculateProcessingFees(provider, basePrice);

    const totalCost = basePrice + shippingCost + taxes + fees;

    return {
      base_price: basePrice,
      shipping_cost: shippingCost,
      taxes,
      fees,
      total_cost: totalCost
    };
  }

  /**
   * Calcula el costo de envío basado en proveedor, cantidad y destino
   */
  private calculateShippingCost(
    provider: ProviderInfo,
    quantity: number,
    shippingAddress: Address
  ): number {
    let shippingCost = provider.shipping_cost;

    // Aplicar ajustes basados en cantidad
    if (quantity > 1) {
      // Items adicionales usualmente tienen costo de envío reducido
      const additionalItems = quantity - 1;
      const additionalShippingPerItem = provider.shipping_cost * 0.3; // 30% del envío base por item adicional
      shippingCost += additionalItems * additionalShippingPerItem;
    }

    // Aplicar multiplicadores basados en distancia
    const distanceMultiplier = this.getDistanceMultiplier(provider.name, shippingAddress.country);
    shippingCost *= distanceMultiplier;

    // Aplicar envío express si el tiempo de entrega es muy rápido
    if (provider.delivery_time <= 2) {
      shippingCost *= 1.5; // 50% premium por envío express
    }

    return Math.round(shippingCost * 100) / 100; // Redondear a 2 decimales
  }

  /**
   * Calcula impuestos basados en el país de destino
   */
  private calculateTaxes(subtotal: number, country: string): number {
    const taxRate = this.TAX_RATES[country] || 0.20; // Por defecto 20% si no se encuentra el país
    return Math.round(subtotal * taxRate * 100) / 100;
  }

  /**
   * Calcula fees de procesamiento basados en el proveedor
   */
  private calculateProcessingFees(provider: ProviderInfo, basePrice: number): number {
    const feeRate = this.PROCESSING_FEES[provider.name] || 0.025; // Por defecto 2.5%
    return Math.round(basePrice * feeRate * 100) / 100;
  }

  /**
   * Obtiene multiplicador de distancia basado en ubicación del proveedor y destino de envío
   */
  private getDistanceMultiplier(providerName: string, destinationCountry: string): number {
    // Cálculo simplificado de distancia - en realidad usaría datos geográficos reales
    const providerLocations: Record<string, string> = {
      'Amazon': 'US',
      'AliExpress': 'CN',
      'eBay': 'US',
      'Banggood': 'CN',
      'Newegg': 'US',
      'Local Supplier': 'ES'
    };

    const providerCountry = providerLocations[providerName] || 'US';

    // Mismo país o región
    if (providerCountry === destinationCountry) {
      return 1.0;
    }

    // Envío interno de la Unión Europea
    const euCountries = ['ES', 'FR', 'DE', 'IT', 'PT'];
    if (euCountries.includes(providerCountry) && euCountries.includes(destinationCountry)) {
      return 1.2;
    }

    // Envío intercontinental
    const continents: Record<string, string> = {
      'ES': 'EU', 'FR': 'EU', 'DE': 'EU', 'IT': 'EU', 'PT': 'EU', 'UK': 'EU',
      'US': 'NA',
      'CN': 'AS'
    };

    const providerContinent = continents[providerCountry] || 'NA';
    const destinationContinent = continents[destinationCountry] || 'EU';

    if (providerContinent !== destinationContinent) {
      return 1.8; // 80% de incremento por envío intercontinental
    }

    return 1.4; // 40% de incremento por internacional pero mismo continente
  }

  /**
   * Compara costos entre múltiples proveedores
   */
  async compareCosts(
    providers: ProviderInfo[],
    quantity: number,
    shippingAddress: Address
  ): Promise<Array<{ provider: ProviderInfo; cost: CostCalculation }>> {
    const comparisons: Array<{ provider: ProviderInfo; cost: CostCalculation }> = [];

    for (const provider of providers) {
      const cost = await this.execute(provider, quantity, shippingAddress);
      comparisons.push({ provider, cost });
    }

    // Ordenar por costo total (menor primero)
    return comparisons.sort((a, b) => a.cost.total_cost - b.cost.total_cost);
  }

  /**
   * Calcula ahorros potenciales comparado con la opción más cara
   */
  calculateSavings(costComparisons: Array<{ provider: ProviderInfo; cost: CostCalculation }>): number {
    if (costComparisons.length < 2) return 0;

    const cheapest = costComparisons[0].cost.total_cost;
    const mostExpensive = costComparisons[costComparisons.length - 1].cost.total_cost;

    return mostExpensive - cheapest;
  }
}
