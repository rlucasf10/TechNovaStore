import { NormalizedProduct, ConflictResolution, ConflictStrategy } from '../types/sync';

export class ConflictResolver {
  private resolutionRules: ConflictResolution[] = [];
  private providerPriority: string[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  async resolveProduct(newProduct: NormalizedProduct): Promise<NormalizedProduct> {
    // Check if product already exists (this would query the database)
    const existingProduct = await this.findExistingProduct(newProduct.sku);

    if (!existingProduct) {
      // New product, no conflicts to resolve
      return newProduct;
    }

    console.log(`Resolving conflicts for product ${newProduct.sku}`);

    // Merge providers
    const mergedProviders = this.mergeProviders(existingProduct.providers, newProduct.providers);

    // Resolve field conflicts
    const resolvedProduct: NormalizedProduct = {
      ...existingProduct,
      providers: mergedProviders,
      last_synced: new Date()
    };

    // Apply resolution rules for each field
    for (const rule of this.resolutionRules) {
      const fieldKey = rule.field as keyof NormalizedProduct;
      const resolvedValue = this.resolveField(
        rule,
        existingProduct[fieldKey],
        newProduct[fieldKey],
        existingProduct,
        newProduct
      );

      // Use type assertion to safely assign the resolved value
      (resolvedProduct as any)[fieldKey] = resolvedValue;
    }

    // Recalculate our price based on best provider price
    const bestProvider = this.getBestProvider(resolvedProduct.providers);
    if (bestProvider) {
      resolvedProduct.our_price = this.calculateOurPrice(
        bestProvider.price,
        resolvedProduct.markup_percentage
      );
    }

    // Update availability based on any provider having stock
    resolvedProduct.is_active = resolvedProduct.providers.some(p => p.availability);

    return resolvedProduct;
  }

  private resolveField(
    rule: ConflictResolution,
    existingValue: any,
    newValue: any,
    existingProduct: NormalizedProduct,
    newProduct: NormalizedProduct
  ): any {
    switch (rule.strategy) {
      case ConflictStrategy.LATEST_WINS:
        return newValue;

      case ConflictStrategy.PROVIDER_PRIORITY:
        return this.resolveByProviderPriority(
          rule,
          existingValue,
          newValue,
          existingProduct,
          newProduct
        );

      case ConflictStrategy.LOWEST_PRICE:
        if (rule.field === 'our_price' && typeof existingValue === 'number' && typeof newValue === 'number') {
          return Math.min(existingValue, newValue);
        }
        return existingValue; // Keep existing if not price-related

      case ConflictStrategy.HIGHEST_AVAILABILITY:
        if (rule.field === 'is_active') {
          return existingValue || newValue; // True if either is true
        }
        return existingValue;

      case ConflictStrategy.MANUAL_REVIEW:
        // Log for manual review
        console.warn(`Manual review required for field ${rule.field} on product ${existingProduct.sku}`);
        return existingValue; // Keep existing until manual review

      default:
        return existingValue;
    }
  }

  private resolveByProviderPriority(
    rule: ConflictResolution,
    existingValue: any,
    newValue: any,
    existingProduct: NormalizedProduct,
    newProduct: NormalizedProduct
  ): any {
    if (!rule.priority_order || rule.priority_order.length === 0) {
      return existingValue;
    }

    // Find the highest priority provider that has this product
    const existingProviderPriority = this.getProviderPriority(existingProduct.providers[0]?.name);
    const newProviderPriority = this.getProviderPriority(newProduct.providers[0]?.name);

    // Lower index = higher priority
    if (newProviderPriority < existingProviderPriority) {
      return newValue;
    }

    return existingValue;
  }

  private mergeProviders(existingProviders: any[], newProviders: any[]): any[] {
    const providerMap = new Map();

    // Add existing providers
    for (const provider of existingProviders) {
      providerMap.set(provider.name, provider);
    }

    // Update or add new providers
    for (const provider of newProviders) {
      const existing = providerMap.get(provider.name);

      if (existing) {
        // Update existing provider with newer information
        providerMap.set(provider.name, {
          ...existing,
          ...provider,
          last_updated: new Date()
        });
      } else {
        // Add new provider
        providerMap.set(provider.name, provider);
      }
    }

    return Array.from(providerMap.values());
  }

  private getBestProvider(providers: any[]): any | null {
    if (providers.length === 0) return null;

    // Find provider with lowest total cost (price + shipping) and availability
    const availableProviders = providers.filter(p => p.availability);

    if (availableProviders.length === 0) {
      // No available providers, return the one with lowest price
      return providers.reduce((best, current) =>
        current.price < best.price ? current : best
      );
    }

    // Return available provider with lowest total cost
    return availableProviders.reduce((best, current) => {
      const currentTotal = current.price + current.shipping_cost;
      const bestTotal = best.price + best.shipping_cost;
      return currentTotal < bestTotal ? current : best;
    });
  }

  private calculateOurPrice(providerPrice: number, markupPercentage: number): number {
    const markup = providerPrice * (markupPercentage / 100);
    return Math.round((providerPrice + markup) * 100) / 100;
  }

  private getProviderPriority(providerName: string): number {
    const index = this.providerPriority.indexOf(providerName);
    return index === -1 ? 999 : index; // Unknown providers get lowest priority
  }

  private async findExistingProduct(sku: string): Promise<NormalizedProduct | null> {
    // TODO: Implement database query to find existing product
    // This is a placeholder that would query the actual database
    console.log(`Looking for existing product with SKU: ${sku}`);
    return null; // Return null for now (no existing product)
  }

  private initializeDefaultRules(): void {
    // Default conflict resolution rules
    this.resolutionRules = [
      {
        field: 'name',
        strategy: ConflictStrategy.PROVIDER_PRIORITY,
        priority_order: ['Amazon', 'eBay', 'Newegg', 'AliExpress', 'Banggood']
      },
      {
        field: 'description',
        strategy: ConflictStrategy.PROVIDER_PRIORITY,
        priority_order: ['Amazon', 'eBay', 'Newegg', 'AliExpress', 'Banggood']
      },
      {
        field: 'images',
        strategy: ConflictStrategy.LATEST_WINS
      },
      {
        field: 'specifications',
        strategy: ConflictStrategy.LATEST_WINS
      },
      {
        field: 'brand',
        strategy: ConflictStrategy.PROVIDER_PRIORITY,
        priority_order: ['Amazon', 'eBay', 'Newegg', 'AliExpress', 'Banggood']
      },
      {
        field: 'category',
        strategy: ConflictStrategy.PROVIDER_PRIORITY,
        priority_order: ['Amazon', 'eBay', 'Newegg', 'AliExpress', 'Banggood']
      }
    ];

    // Default provider priority (higher quality/reliability first)
    this.providerPriority = [
      'Amazon',
      'eBay',
      'Newegg',
      'AliExpress',
      'Banggood'
    ];
  }

  // Configuration methods
  addResolutionRule(rule: ConflictResolution): void {
    // Remove existing rule for the same field
    this.resolutionRules = this.resolutionRules.filter(r => r.field !== rule.field);
    this.resolutionRules.push(rule);
  }

  setProviderPriority(priority: string[]): void {
    this.providerPriority = [...priority];
  }

  getResolutionRules(): ConflictResolution[] {
    return [...this.resolutionRules];
  }

  getProviderPriorityOrder(): string[] {
    return [...this.providerPriority];
  }

  // Method to handle specific conflict scenarios
  async resolveSpecificConflict(
    field: string,
    values: { provider: string; value: any }[],
    strategy: ConflictStrategy
  ): Promise<any> {
    switch (strategy) {
      case ConflictStrategy.PROVIDER_PRIORITY:
        // Return value from highest priority provider
        for (const provider of this.providerPriority) {
          const match = values.find(v => v.provider === provider);
          if (match) return match.value;
        }
        return values[0]?.value; // Fallback to first value

      case ConflictStrategy.LATEST_WINS:
        // Return the last value (assuming values are ordered by time)
        return values[values.length - 1]?.value;

      case ConflictStrategy.LOWEST_PRICE:
        if (field.includes('price')) {
          const numericValues = values
            .map(v => ({ ...v, value: parseFloat(v.value) }))
            .filter(v => !isNaN(v.value));

          if (numericValues.length > 0) {
            return Math.min(...numericValues.map(v => v.value));
          }
        }
        return values[0]?.value;

      case ConflictStrategy.HIGHEST_AVAILABILITY:
        if (field.includes('availability') || field.includes('active')) {
          return values.some(v => v.value === true);
        }
        return values[0]?.value;

      default:
        return values[0]?.value;
    }
  }
}