// Pricing-specific types

export interface PriceComparison {
  sku: string;
  product_name: string;
  providers: ProviderPrice[];
  best_price: ProviderPrice;
  our_price: number;
  markup_percentage: number;
  savings: number;
  last_updated: Date;
}

export interface ProviderPrice {
  provider: string;
  price: number;
  shipping_cost: number;
  total_cost: number;
  availability: boolean;
  delivery_time: number;
  currency: string;
  last_updated: Date;
  url: string;
}

export interface PricingRule {
  id: string;
  name: string;
  category?: string;
  brand?: string;
  min_markup_percentage: number;
  max_markup_percentage: number;
  target_margin: number;
  competitor_factor: number; // How much to consider competitor prices
  is_active: boolean;
}

export interface DynamicPricingConfig {
  enabled: boolean;
  update_frequency_minutes: number;
  price_change_threshold: number; // Minimum change to trigger update
  max_price_increase_percentage: number;
  max_price_decrease_percentage: number;
  competitor_weight: number; // 0-1, how much competitor prices influence our price
  demand_weight: number; // 0-1, how much demand influences our price
  inventory_weight: number; // 0-1, how much inventory levels influence our price
}

export interface PriceHistory {
  sku: string;
  provider: string;
  price: number;
  timestamp: Date;
  change_percentage?: number;
}

export interface MarketAnalysis {
  sku: string;
  average_market_price: number;
  lowest_market_price: number;
  highest_market_price: number;
  price_volatility: number;
  market_position: 'competitive' | 'premium' | 'budget';
  recommended_price: number;
  confidence_score: number;
}

export interface PricingAlert {
  id: string;
  sku: string;
  type: PricingAlertType;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: Date;
  resolved: boolean;
}

export enum PricingAlertType {
  PRICE_DROP = 'price_drop',
  PRICE_SPIKE = 'price_spike',
  COMPETITOR_UNDERCUT = 'competitor_undercut',
  MARGIN_TOO_LOW = 'margin_too_low',
  OUT_OF_STOCK = 'out_of_stock',
  PRICING_ERROR = 'pricing_error'
}