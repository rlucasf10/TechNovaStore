import { ProviderAdapter, ProviderConfig, ProviderType } from '../types/provider';
import { AmazonAdapter } from './AmazonAdapter';
import { AliExpressAdapter } from './AliExpressAdapter';
import { EbayAdapter } from './EbayAdapter';
import { BanggoodAdapter } from './BanggoodAdapter';
import { NeweggAdapter } from './NeweggAdapter';

export class AdapterFactory {
  private static adapters: Map<string, ProviderAdapter> = new Map();

  static createAdapter(type: ProviderType, config: ProviderConfig): ProviderAdapter {
    const key = `${type}_${config.name}`;
    
    // Return existing adapter if already created
    if (this.adapters.has(key)) {
      return this.adapters.get(key)!;
    }

    let adapter: ProviderAdapter;

    switch (type) {
      case ProviderType.AMAZON:
        adapter = new AmazonAdapter(config);
        break;
      case ProviderType.ALIEXPRESS:
        adapter = new AliExpressAdapter(config);
        break;
      case ProviderType.EBAY:
        adapter = new EbayAdapter(config);
        break;
      case ProviderType.BANGGOOD:
        adapter = new BanggoodAdapter(config);
        break;
      case ProviderType.NEWEGG:
        adapter = new NeweggAdapter(config);
        break;
      default:
        throw new Error(`Unsupported provider type: ${type}`);
    }

    this.adapters.set(key, adapter);
    return adapter;
  }

  static getAllAdapters(): ProviderAdapter[] {
    return Array.from(this.adapters.values());
  }

  static getAdapter(type: ProviderType, name?: string): ProviderAdapter | undefined {
    if (name) {
      const key = `${type}_${name}`;
      return this.adapters.get(key);
    }
    
    // If no name provided, find the first adapter of this type
    for (const [key, adapter] of this.adapters.entries()) {
      if (key.startsWith(`${type}_`)) {
        return adapter;
      }
    }
    
    return undefined;
  }

  static removeAdapter(type: ProviderType, name?: string): boolean {
    const key = name ? `${type}_${name}` : type;
    return this.adapters.delete(key);
  }

  static clearAdapters(): void {
    this.adapters.clear();
  }

  static getAdapterCount(): number {
    return this.adapters.size;
  }

  static getDefaultConfigs(): Record<ProviderType, ProviderConfig> {
    return {
      [ProviderType.AMAZON]: {
        name: 'Amazon',
        baseUrl: 'https://webservices.amazon.es',
        rateLimit: 10, // 10 requests per minute
        timeout: 30000,
        retryAttempts: 3
      },
      [ProviderType.ALIEXPRESS]: {
        name: 'AliExpress',
        baseUrl: 'https://api-sg.aliexpress.com',
        rateLimit: 20, // 20 requests per minute
        timeout: 30000,
        retryAttempts: 3
      },
      [ProviderType.EBAY]: {
        name: 'eBay',
        baseUrl: 'https://api.ebay.com',
        rateLimit: 15, // 15 requests per minute
        timeout: 30000,
        retryAttempts: 3
      },
      [ProviderType.BANGGOOD]: {
        name: 'Banggood',
        baseUrl: 'https://api.banggood.com',
        rateLimit: 12, // 12 requests per minute
        timeout: 30000,
        retryAttempts: 3
      },
      [ProviderType.NEWEGG]: {
        name: 'Newegg',
        baseUrl: 'https://api.newegg.com',
        rateLimit: 8, // 8 requests per minute
        timeout: 30000,
        retryAttempts: 3
      }
    };
  }
}