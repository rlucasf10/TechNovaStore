// Provider-specific types for sync engine

export interface ProviderProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  availability: boolean;
  images: string[];
  specifications: Record<string, any>;
  category: string;
  brand: string;
  shipping_cost?: number;
  delivery_time?: number;
  url: string;
}

export interface ProviderConfig {
  name: string;
  apiKey?: string;
  apiSecret?: string;
  baseUrl: string;
  rateLimit: number; // requests per minute
  timeout: number; // milliseconds
  retryAttempts: number;
}

export interface SyncResult {
  provider: string;
  success: boolean;
  productsProcessed: number;
  productsUpdated: number;
  productsAdded: number;
  errors: string[];
  duration: number;
}

export interface ProviderAdapter {
  name: string;
  config: ProviderConfig;
  
  // Core methods
  searchProducts(query: string, options?: SearchOptions): Promise<ProviderProduct[]>;
  getProduct(productId: string): Promise<ProviderProduct | null>;
  checkAvailability(productId: string): Promise<boolean>;
  getPrice(productId: string): Promise<number | null>;
  
  // Utility methods
  isHealthy(): Promise<boolean>;
  getRateLimit(): number;
}

export interface SearchOptions {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}

export enum ProviderType {
  AMAZON = 'amazon',
  ALIEXPRESS = 'aliexpress',
  EBAY = 'ebay',
  BANGGOOD = 'banggood',
  NEWEGG = 'newegg'
}