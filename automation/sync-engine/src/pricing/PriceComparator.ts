import { ProviderAdapter } from '../types/provider';
import { 
  PriceComparison, 
  ProviderPrice, 
  PricingRule, 
  MarketAnalysis,
  PricingAlert,
  PricingAlertType
} from '../types/pricing';
import { AdapterFactory } from '../adapters/AdapterFactory';
import { PriceCache } from './PriceCache';

export class PriceComparator {
  private priceCache: PriceCache;
  private pricingRules: Map<string, PricingRule> = new Map();
  private alerts: PricingAlert[] = [];

  constructor(priceCache: PriceCache) {
    this.priceCache = priceCache;
    this.initializeDefaultRules();
  }

  async compareProductPrices(sku: string, productName: string): Promise<PriceComparison> {
    console.log(`Comparing prices for product: ${sku}`);
    
    const adapters = AdapterFactory.getAllAdapters();
    const providerPrices: ProviderPrice[] = [];

    // Get prices from all providers
    for (const adapter of adapters) {
      try {
        const cachedPrice = await this.priceCache.getPrice(sku, adapter.name);
        
        if (cachedPrice && this.isCacheValid(cachedPrice.last_updated)) {
          providerPrices.push(cachedPrice);
          continue;
        }

        // Fetch fresh price data
        const priceData = await this.fetchProviderPrice(adapter, sku);
        if (priceData) {
          providerPrices.push(priceData);
          await this.priceCache.setPrice(sku, adapter.name, priceData);
        }
      } catch (error) {
        console.error(`Error fetching price from ${adapter.name}:`, error);
      }
    }

    if (providerPrices.length === 0) {
      throw new Error(`No prices found for product ${sku}`);
    }

    // Find best price (lowest total cost with availability)
    const bestPrice = this.findBestPrice(providerPrices);
    
    // Calculate our price based on pricing rules
    const pricingRule = this.getPricingRule(sku);
    const ourPrice = this.calculateOurPrice(bestPrice, pricingRule);
    
    // Calculate savings compared to average market price
    const averagePrice = this.calculateAveragePrice(providerPrices);
    const savings = Math.max(0, averagePrice - ourPrice);

    const comparison: PriceComparison = {
      sku,
      product_name: productName,
      providers: providerPrices.sort((a, b) => a.total_cost - b.total_cost),
      best_price: bestPrice,
      our_price: ourPrice,
      markup_percentage: pricingRule.min_markup_percentage,
      savings,
      last_updated: new Date()
    };

    // Check for pricing alerts
    await this.checkPricingAlerts(comparison);

    return comparison;
  }

  async batchCompareProducts(products: { sku: string; name: string }[]): Promise<PriceComparison[]> {
    console.log(`Batch comparing prices for ${products.length} products`);
    
    const comparisons: PriceComparison[] = [];
    const batchSize = 10; // Process in batches to avoid overwhelming APIs

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const batchPromises = batch.map(product => 
        this.compareProductPrices(product.sku, product.name)
          .catch(error => {
            console.error(`Error comparing prices for ${product.sku}:`, error);
            return null;
          })
      );

      const batchResults = await Promise.all(batchPromises);
      comparisons.push(...batchResults.filter(result => result !== null) as PriceComparison[]);

      // Add delay between batches to respect rate limits
      if (i + batchSize < products.length) {
        await this.sleep(2000);
      }
    }

    return comparisons;
  }

  async analyzeMarket(sku: string): Promise<MarketAnalysis> {
    const comparison = await this.compareProductPrices(sku, '');
    
    const prices = comparison.providers
      .filter(p => p.availability)
      .map(p => p.total_cost);

    if (prices.length === 0) {
      throw new Error(`No available prices for market analysis of ${sku}`);
    }

    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);
    
    // Calculate price volatility (standard deviation)
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - averagePrice, 2), 0) / prices.length;
    const volatility = Math.sqrt(variance) / averagePrice;

    // Determine market position
    let marketPosition: 'competitive' | 'premium' | 'budget';
    if (comparison.our_price <= averagePrice * 0.9) {
      marketPosition = 'budget';
    } else if (comparison.our_price >= averagePrice * 1.1) {
      marketPosition = 'premium';
    } else {
      marketPosition = 'competitive';
    }

    // Calculate recommended price based on market analysis
    const recommendedPrice = this.calculateRecommendedPrice(comparison, averagePrice, lowestPrice);
    
    // Calculate confidence score based on data quality
    const confidenceScore = this.calculateConfidenceScore(comparison.providers.length, volatility);

    return {
      sku,
      average_market_price: Math.round(averagePrice * 100) / 100,
      lowest_market_price: lowestPrice,
      highest_market_price: highestPrice,
      price_volatility: Math.round(volatility * 10000) / 100, // As percentage
      market_position: marketPosition,
      recommended_price: recommendedPrice,
      confidence_score: confidenceScore
    };
  }

  private async fetchProviderPrice(adapter: ProviderAdapter, sku: string): Promise<ProviderPrice | null> {
    try {
      // This would need to be adapted based on how we store the mapping between SKU and provider product ID
      const productId = await this.getProviderProductId(sku, adapter.name);
      if (!productId) return null;

      const [price, availability] = await Promise.all([
        adapter.getPrice(productId),
        adapter.checkAvailability(productId)
      ]);

      if (price === null) return null;

      // Estimate shipping cost and delivery time (would be fetched from product details in real implementation)
      const shippingCost = this.estimateShippingCost(adapter.name, price);
      const deliveryTime = this.estimateDeliveryTime(adapter.name);

      return {
        provider: adapter.name,
        price,
        shipping_cost: shippingCost,
        total_cost: price + shippingCost,
        availability,
        delivery_time: deliveryTime,
        currency: 'EUR',
        last_updated: new Date(),
        url: `https://${adapter.name.toLowerCase()}.com/product/${productId}`
      };
    } catch (error) {
      console.error(`Error fetching price from ${adapter.name}:`, error);
      return null;
    }
  }

  private findBestPrice(prices: ProviderPrice[]): ProviderPrice {
    // Prioritize available products
    const availablePrices = prices.filter(p => p.availability);
    const targetPrices = availablePrices.length > 0 ? availablePrices : prices;

    // Find lowest total cost
    return targetPrices.reduce((best, current) => 
      current.total_cost < best.total_cost ? current : best
    );
  }

  private calculateOurPrice(bestPrice: ProviderPrice, rule: PricingRule): number {
    const basePrice = bestPrice.total_cost;
    const markup = basePrice * (rule.min_markup_percentage / 100);
    return Math.round((basePrice + markup) * 100) / 100;
  }

  private calculateAveragePrice(prices: ProviderPrice[]): number {
    const availablePrices = prices.filter(p => p.availability);
    const targetPrices = availablePrices.length > 0 ? availablePrices : prices;
    
    const sum = targetPrices.reduce((total, price) => total + price.total_cost, 0);
    return sum / targetPrices.length;
  }

  private calculateRecommendedPrice(
    comparison: PriceComparison, 
    averagePrice: number, 
    lowestPrice: number
  ): number {
    // Strategy: Price slightly below average but maintain minimum margin
    const targetPrice = averagePrice * 0.95; // 5% below average
    const minPrice = lowestPrice * 1.1; // 10% above lowest
    
    return Math.round(Math.max(targetPrice, minPrice) * 100) / 100;
  }

  private calculateConfidenceScore(providerCount: number, volatility: number): number {
    // Higher confidence with more providers and lower volatility
    const providerScore = Math.min(providerCount / 5, 1); // Max score at 5+ providers
    const volatilityScore = Math.max(0, 1 - volatility); // Lower volatility = higher score
    
    return Math.round((providerScore * 0.6 + volatilityScore * 0.4) * 100);
  }

  private async checkPricingAlerts(comparison: PriceComparison): Promise<void> {
    const alerts: PricingAlert[] = [];

    // Check for significant price drops
    const previousComparison = await this.priceCache.getPreviousComparison(comparison.sku);
    if (previousComparison) {
      const priceChange = (comparison.our_price - previousComparison.our_price) / previousComparison.our_price;
      
      if (priceChange < -0.1) { // 10% drop
        alerts.push({
          id: this.generateAlertId(),
          sku: comparison.sku,
          type: PricingAlertType.PRICE_DROP,
          message: `Price dropped by ${Math.abs(priceChange * 100).toFixed(1)}%`,
          severity: 'medium',
          created_at: new Date(),
          resolved: false
        });
      } else if (priceChange > 0.15) { // 15% increase
        alerts.push({
          id: this.generateAlertId(),
          sku: comparison.sku,
          type: PricingAlertType.PRICE_SPIKE,
          message: `Price increased by ${(priceChange * 100).toFixed(1)}%`,
          severity: 'high',
          created_at: new Date(),
          resolved: false
        });
      }
    }

    // Check if competitors are significantly undercutting us
    const competitorPrices = comparison.providers.filter(p => p.availability && p.total_cost < comparison.our_price * 0.9);
    if (competitorPrices.length > 0) {
      alerts.push({
        id: this.generateAlertId(),
        sku: comparison.sku,
        type: PricingAlertType.COMPETITOR_UNDERCUT,
        message: `${competitorPrices.length} competitors pricing 10%+ below us`,
        severity: 'medium',
        created_at: new Date(),
        resolved: false
      });
    }

    // Check for low margins
    const margin = (comparison.our_price - comparison.best_price.total_cost) / comparison.our_price;
    if (margin < 0.1) { // Less than 10% margin
      alerts.push({
        id: this.generateAlertId(),
        sku: comparison.sku,
        type: PricingAlertType.MARGIN_TOO_LOW,
        message: `Margin is only ${(margin * 100).toFixed(1)}%`,
        severity: 'high',
        created_at: new Date(),
        resolved: false
      });
    }

    this.alerts.push(...alerts);
  }

  private getPricingRule(sku: string): PricingRule {
    // Try to find specific rule for this SKU or use default
    return this.pricingRules.get(sku) || this.pricingRules.get('default')!;
  }

  private isCacheValid(lastUpdated: Date): boolean {
    const cacheValidityMinutes = 30; // Cache valid for 30 minutes
    const now = new Date();
    const diffMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
    return diffMinutes < cacheValidityMinutes;
  }

  private async getProviderProductId(sku: string, providerName: string): Promise<string | null> {
    // TODO: Implement database lookup to get provider-specific product ID
    // This would query the products table to find the external_id for the given provider
    console.log(`Getting provider product ID for ${sku} from ${providerName}`);
    return null; // Placeholder
  }

  private estimateShippingCost(providerName: string, price: number): number {
    // Simplified shipping cost estimation
    const shippingRates: Record<string, number> = {
      'Amazon': 0, // Prime shipping
      'eBay': price > 50 ? 0 : 5.99,
      'AliExpress': 2.99,
      'Banggood': 4.99,
      'Newegg': price > 49 ? 0 : 7.99
    };

    return shippingRates[providerName] || 5.99;
  }

  private estimateDeliveryTime(providerName: string): number {
    // Estimated delivery times in days
    const deliveryTimes: Record<string, number> = {
      'Amazon': 2,
      'eBay': 5,
      'AliExpress': 15,
      'Banggood': 10,
      'Newegg': 3
    };

    return deliveryTimes[providerName] || 7;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private initializeDefaultRules(): void {
    // Default pricing rule
    this.pricingRules.set('default', {
      id: 'default',
      name: 'Default Pricing Rule',
      min_markup_percentage: 20,
      max_markup_percentage: 40,
      target_margin: 25,
      competitor_factor: 0.7,
      is_active: true
    });

    // Category-specific rules
    this.pricingRules.set('gaming', {
      id: 'gaming',
      name: 'Gaming Products',
      category: 'Gaming',
      min_markup_percentage: 25,
      max_markup_percentage: 45,
      target_margin: 30,
      competitor_factor: 0.8,
      is_active: true
    });

    this.pricingRules.set('accessories', {
      id: 'accessories',
      name: 'Accessories',
      category: 'Accessories',
      min_markup_percentage: 30,
      max_markup_percentage: 50,
      target_margin: 35,
      competitor_factor: 0.6,
      is_active: true
    });
  }

  // Public methods for managing pricing rules
  addPricingRule(rule: PricingRule): void {
    this.pricingRules.set(rule.id, rule);
  }

  getPricingRules(): PricingRule[] {
    return Array.from(this.pricingRules.values());
  }

  getAlerts(): PricingAlert[] {
    return [...this.alerts];
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }
}