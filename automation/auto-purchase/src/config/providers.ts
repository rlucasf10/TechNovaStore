import { ProviderConfig, ProviderName } from '../types/provider';

export const PROVIDER_CONFIGS: Record<ProviderName, ProviderConfig> = {
  amazon: {
    name: 'amazon',
    display_name: 'Amazon',
    base_url: 'https://api.amazon.com',
    weight: 90,
    max_retry_attempts: 3,
    timeout_ms: 10000,
    shipping_zones: ['EU', 'US', 'ES'],
    supported_countries: ['ES', 'FR', 'DE', 'IT', 'PT', 'US', 'UK']
  },
  aliexpress: {
    name: 'aliexpress',
    display_name: 'AliExpress',
    base_url: 'https://api.aliexpress.com',
    weight: 70,
    max_retry_attempts: 2,
    timeout_ms: 15000,
    shipping_zones: ['GLOBAL'],
    supported_countries: ['ES', 'FR', 'DE', 'IT', 'PT', 'US', 'UK', 'CN']
  },
  ebay: {
    name: 'ebay',
    display_name: 'eBay',
    base_url: 'https://api.ebay.com',
    weight: 75,
    max_retry_attempts: 3,
    timeout_ms: 12000,
    shipping_zones: ['EU', 'US'],
    supported_countries: ['ES', 'FR', 'DE', 'IT', 'PT', 'US', 'UK']
  },
  banggood: {
    name: 'banggood',
    display_name: 'Banggood',
    base_url: 'https://api.banggood.com',
    weight: 65,
    max_retry_attempts: 2,
    timeout_ms: 15000,
    shipping_zones: ['GLOBAL'],
    supported_countries: ['ES', 'FR', 'DE', 'IT', 'PT', 'US', 'UK', 'CN']
  },
  newegg: {
    name: 'newegg',
    display_name: 'Newegg',
    base_url: 'https://api.newegg.com',
    weight: 80,
    max_retry_attempts: 3,
    timeout_ms: 10000,
    shipping_zones: ['US', 'EU'],
    supported_countries: ['ES', 'FR', 'DE', 'IT', 'PT', 'US', 'UK']
  },
  local: {
    name: 'local',
    display_name: 'Local Supplier',
    base_url: 'https://api.localsupplier.com',
    weight: 95,
    max_retry_attempts: 2,
    timeout_ms: 8000,
    shipping_zones: ['ES'],
    supported_countries: ['ES']
  }
};

export const DEFAULT_SELECTION_WEIGHTS = {
  price: 0.4,           // 40% weight on total cost
  delivery_time: 0.25,  // 25% weight on delivery speed
  reliability: 0.25,    // 25% weight on provider reliability
  availability: 0.1     // 10% weight on stock availability
};

export const MAX_DELIVERY_DAYS = 30;
export const MIN_RELIABILITY_SCORE = 60;
export const FALLBACK_PROVIDER_COUNT = 2;