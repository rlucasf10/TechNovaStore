import { Address } from '@technovastore/shared-types';

export interface ProviderInfo {
  name: string;
  price: number;
  availability: boolean;
  shipping_cost: number;
  delivery_time: number; // in days
  last_updated: Date;
  reliability_score: number; // 0-100
  api_endpoint?: string;
  api_key?: string;
}

export interface ProviderSelection {
  provider: ProviderInfo;
  total_cost: number;
  estimated_delivery: Date;
  confidence_score: number;
  fallback_providers: ProviderInfo[];
}

export interface CostCalculation {
  base_price: number;
  shipping_cost: number;
  taxes: number;
  fees: number;
  total_cost: number;
}

export interface ProviderAvailability {
  provider_name: string;
  is_available: boolean;
  stock_quantity?: number;
  last_checked: Date;
  error_message?: string;
}

export interface SelectionCriteria {
  product_sku: string;
  quantity: number;
  shipping_address: Address;
  max_delivery_time?: number;
  preferred_providers?: string[];
  exclude_providers?: string[];
}

export type ProviderName = 'amazon' | 'aliexpress' | 'ebay' | 'banggood' | 'newegg' | 'local';

export interface ProviderConfig {
  name: ProviderName;
  display_name: string;
  base_url: string;
  api_key?: string;
  weight: number; // Priority weight for selection
  max_retry_attempts: number;
  timeout_ms: number;
  shipping_zones: string[];
  supported_countries: string[];
}