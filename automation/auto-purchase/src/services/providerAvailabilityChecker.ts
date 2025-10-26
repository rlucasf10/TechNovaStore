import { ProviderAvailability, ProviderName } from '../types/provider';
import { PROVIDER_CONFIGS } from '../config/providers';

export class ProviderAvailabilityChecker {
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
  private availabilityCache = new Map<string, { data: ProviderAvailability; timestamp: number }>();

  /**
   * Checks if a provider has the product available in the required quantity
   * Requirements: 2.3 - Fallback system for unavailable providers
   */
  async checkAvailability(
    providerName: ProviderName,
    productSku: string,
    quantity: number
  ): Promise<ProviderAvailability> {
    const cacheKey = `${providerName}-${productSku}-${quantity}`;
    
    // Check cache first
    const cached = this.availabilityCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION_MS) {
      return cached.data;
    }

    try {
      const availability = await this.checkProviderAvailability(providerName, productSku, quantity);
      
      // Cache the result
      this.availabilityCache.set(cacheKey, {
        data: availability,
        timestamp: Date.now()
      });

      return availability;
    } catch (error) {
      const errorAvailability: ProviderAvailability = {
        provider_name: providerName,
        is_available: false,
        last_checked: new Date(),
        error_message: error instanceof Error ? error.message : 'Unknown error'
      };

      return errorAvailability;
    }
  }

  /**
   * Checks availability for multiple providers in parallel
   */
  async checkMultipleProviders(
    providers: ProviderName[],
    productSku: string,
    quantity: number
  ): Promise<ProviderAvailability[]> {
    const availabilityPromises = providers.map(provider =>
      this.checkAvailability(provider, productSku, quantity)
    );

    return Promise.all(availabilityPromises);
  }

  /**
   * Gets the first available provider from a list
   */
  async getFirstAvailableProvider(
    providers: ProviderName[],
    productSku: string,
    quantity: number
  ): Promise<ProviderAvailability | null> {
    for (const provider of providers) {
      const availability = await this.checkAvailability(provider, productSku, quantity);
      if (availability.is_available) {
        return availability;
      }
    }
    return null;
  }

  /**
   * Actual provider availability check - this would integrate with real APIs
   */
  private async checkProviderAvailability(
    providerName: ProviderName,
    productSku: string,
    quantity: number
  ): Promise<ProviderAvailability> {
    const config = PROVIDER_CONFIGS[providerName];
    
    if (!config) {
      throw new Error(`Unknown provider: ${providerName}`);
    }

    // Mock implementation - in real scenario, this would call actual provider APIs
    const availability = await this.mockProviderApiCall(providerName, productSku, quantity);
    
    return {
      provider_name: providerName,
      is_available: availability.available,
      stock_quantity: availability.stock,
      last_checked: new Date(),
      error_message: availability.error
    };
  }

  /**
   * Mock provider API call - replace with real API integrations
   */
  private async mockProviderApiCall(
    providerName: ProviderName,
    productSku: string,
    quantity: number
  ): Promise<{ available: boolean; stock?: number; error?: string }> {
    // Simulate API call delay
    const delay = process.env.NODE_ENV === 'test' ? 50 : Math.random() * 1000 + 500;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Mock different scenarios based on provider
    const mockScenarios: Record<ProviderName, () => { available: boolean; stock?: number; error?: string }> = {
      amazon: () => {
        // Amazon usually has good availability
        const available = Math.random() > 0.1; // 90% availability
        return {
          available,
          stock: available ? Math.floor(Math.random() * 100) + quantity : 0
        };
      },
      aliexpress: () => {
        // AliExpress has variable availability
        const available = Math.random() > 0.3; // 70% availability
        return {
          available,
          stock: available ? Math.floor(Math.random() * 50) + quantity : 0
        };
      },
      ebay: () => {
        // eBay has moderate availability
        const available = Math.random() > 0.2; // 80% availability
        return {
          available,
          stock: available ? Math.floor(Math.random() * 20) + quantity : 0
        };
      },
      banggood: () => {
        // Banggood has lower availability
        const available = Math.random() > 0.4; // 60% availability
        return {
          available,
          stock: available ? Math.floor(Math.random() * 30) + quantity : 0
        };
      },
      newegg: () => {
        // Newegg has good availability for tech products
        const available = Math.random() > 0.15; // 85% availability
        return {
          available,
          stock: available ? Math.floor(Math.random() * 40) + quantity : 0
        };
      },
      local: () => {
        // Local supplier has limited but reliable stock
        const available = Math.random() > 0.25; // 75% availability
        return {
          available,
          stock: available ? Math.floor(Math.random() * 10) + quantity : 0
        };
      }
    };

    const scenario = mockScenarios[providerName];
    if (!scenario) {
      return { available: false, error: 'Provider not supported' };
    }

    try {
      return scenario();
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : 'API call failed'
      };
    }
  }

  /**
   * Clears the availability cache
   */
  clearCache(): void {
    this.availabilityCache.clear();
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.availabilityCache.size,
      entries: Array.from(this.availabilityCache.keys())
    };
  }

  /**
   * Removes expired entries from cache
   */
  cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.availabilityCache.entries()) {
      if (now - value.timestamp > this.CACHE_DURATION_MS) {
        this.availabilityCache.delete(key);
      }
    }
  }
}