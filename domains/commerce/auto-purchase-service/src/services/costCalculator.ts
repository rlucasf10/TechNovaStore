import { Address } from '@technovastore/shared-types';
import { ProviderInfo, CostCalculation } from '../types/provider';

export class CostCalculator {
  private readonly TAX_RATES: Record<string, number> = {
    'ES': 0.21, // Spain VAT
    'FR': 0.20, // France VAT
    'DE': 0.19, // Germany VAT
    'IT': 0.22, // Italy VAT
    'PT': 0.23, // Portugal VAT
    'US': 0.08, // Average US sales tax
    'UK': 0.20  // UK VAT
  };

  private readonly PROCESSING_FEES: Record<string, number> = {
    'Amazon': 0.02,      // 2% processing fee
    'AliExpress': 0.03,  // 3% processing fee
    'eBay': 0.025,       // 2.5% processing fee
    'Banggood': 0.03,    // 3% processing fee
    'Newegg': 0.02,      // 2% processing fee
    'Local Supplier': 0.01 // 1% processing fee
  };

  /**
   * Calculates total cost including all fees and taxes
   * Requirements: 2.2 - Calculate total costs including shipping
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
   * Calculates shipping cost based on provider, quantity, and destination
   */
  private calculateShippingCost(
    provider: ProviderInfo,
    quantity: number,
    shippingAddress: Address
  ): number {
    let shippingCost = provider.shipping_cost;

    // Apply quantity-based shipping adjustments
    if (quantity > 1) {
      // Additional items usually have reduced shipping cost
      const additionalItems = quantity - 1;
      const additionalShippingPerItem = provider.shipping_cost * 0.3; // 30% of base shipping per additional item
      shippingCost += additionalItems * additionalShippingPerItem;
    }

    // Apply distance-based multipliers
    const distanceMultiplier = this.getDistanceMultiplier(provider.name, shippingAddress.country);
    shippingCost *= distanceMultiplier;

    // Apply express shipping if delivery time is very fast
    if (provider.delivery_time <= 2) {
      shippingCost *= 1.5; // 50% premium for express shipping
    }

    return Math.round(shippingCost * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculates taxes based on destination country
   */
  private calculateTaxes(subtotal: number, country: string): number {
    const taxRate = this.TAX_RATES[country] || 0.20; // Default to 20% if country not found
    return Math.round(subtotal * taxRate * 100) / 100;
  }

  /**
   * Calculates processing fees based on provider
   */
  private calculateProcessingFees(provider: ProviderInfo, basePrice: number): number {
    const feeRate = this.PROCESSING_FEES[provider.name] || 0.025; // Default to 2.5%
    return Math.round(basePrice * feeRate * 100) / 100;
  }

  /**
   * Gets distance multiplier based on provider location and shipping destination
   */
  private getDistanceMultiplier(providerName: string, destinationCountry: string): number {
    // Simplified distance calculation - in reality this would use actual geographic data
    const providerLocations: Record<string, string> = {
      'Amazon': 'US',
      'AliExpress': 'CN',
      'eBay': 'US',
      'Banggood': 'CN',
      'Newegg': 'US',
      'Local Supplier': 'ES'
    };

    const providerCountry = providerLocations[providerName] || 'US';

    // Same country or region
    if (providerCountry === destinationCountry) {
      return 1.0;
    }

    // European Union internal shipping
    const euCountries = ['ES', 'FR', 'DE', 'IT', 'PT'];
    if (euCountries.includes(providerCountry) && euCountries.includes(destinationCountry)) {
      return 1.2;
    }

    // Intercontinental shipping
    const continents: Record<string, string> = {
      'ES': 'EU', 'FR': 'EU', 'DE': 'EU', 'IT': 'EU', 'PT': 'EU', 'UK': 'EU',
      'US': 'NA',
      'CN': 'AS'
    };

    const providerContinent = continents[providerCountry] || 'NA';
    const destinationContinent = continents[destinationCountry] || 'EU';

    if (providerContinent !== destinationContinent) {
      return 1.8; // 80% increase for intercontinental shipping
    }

    return 1.4; // 40% increase for international but same continent
  }

  /**
   * Compares costs between multiple providers
   */
  async compareCosts(
    providers: ProviderInfo[],
    quantity: number,
    shippingAddress: Address
  ): Promise<Array<{ provider: ProviderInfo; cost: CostCalculation }>> {
    const comparisons: Array<{ provider: ProviderInfo; cost: CostCalculation }> = [];

    for (const provider of providers) {
      const cost = await this.calculateTotalCost(provider, quantity, shippingAddress);
      comparisons.push({ provider, cost });
    }

    // Sort by total cost (lowest first)
    return comparisons.sort((a, b) => a.cost.total_cost - b.cost.total_cost);
  }

  /**
   * Calculates potential savings compared to the most expensive option
   */
  calculateSavings(costComparisons: Array<{ provider: ProviderInfo; cost: CostCalculation }>): number {
    if (costComparisons.length < 2) return 0;

    const cheapest = costComparisons[0].cost.total_cost;
    const mostExpensive = costComparisons[costComparisons.length - 1].cost.total_cost;

    return mostExpensive - cheapest;
  }
}