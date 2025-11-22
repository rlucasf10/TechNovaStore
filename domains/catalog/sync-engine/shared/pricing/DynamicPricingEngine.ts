import { PriceComparator } from './PriceComparator';
import { PriceCache } from './PriceCache';
import { 
  DynamicPricingConfig, 
  PriceComparison, 
  MarketAnalysis,
  PricingAlert,
  PricingAlertType 
} from '../types/pricing';

export class DynamicPricingEngine {
  private priceComparator: PriceComparator;
  private priceCache: PriceCache;
  private config: DynamicPricingConfig;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    priceComparator: PriceComparator,
    priceCache: PriceCache,
    config: DynamicPricingConfig
  ) {
    this.priceComparator = priceComparator;
    this.priceCache = priceCache;
    this.config = config;
  }

  start(): void {
    if (this.isRunning || !this.config.enabled) {
      console.log('Dynamic pricing engine is already running or disabled');
      return;
    }

    console.log('Starting dynamic pricing engine...');
    this.isRunning = true;

    // Run immediately (async, don't block)
    this.runPricingUpdate().catch(error => {
      console.error('Error in initial pricing update:', error);
    });

    // Schedule periodic updates
    this.intervalId = setInterval(() => {
      this.runPricingUpdate().catch(error => {
        console.error('Error in scheduled pricing update:', error);
      });
    }, this.config.update_frequency_minutes * 60 * 1000);

    console.log(`Dynamic pricing engine started with ${this.config.update_frequency_minutes} minute intervals`);
  }

  stop(): void {
    if (!this.isRunning) {
      console.log('Dynamic pricing engine is not running');
      return;
    }

    console.log('Stopping dynamic pricing engine...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('Dynamic pricing engine stopped');
  }

  async updateProductPrice(sku: string, productName: string): Promise<{
    oldPrice: number;
    newPrice: number;
    changed: boolean;
    reason: string;
  }> {
    try {
      // Get current comparison
      const comparison = await this.priceComparator.compareProductPrices(sku, productName);
      const currentPrice = comparison.our_price;

      // Analyze market conditions
      const marketAnalysis = await this.priceComparator.analyzeMarket(sku);
      
      // Calculate new price based on dynamic factors
      const newPrice = await this.calculateDynamicPrice(comparison, marketAnalysis);
      
      // Check if price change is significant enough
      const priceChangePercentage = Math.abs(newPrice - currentPrice) / currentPrice;
      
      if (priceChangePercentage < this.config.price_change_threshold) {
        return {
          oldPrice: currentPrice,
          newPrice: currentPrice,
          changed: false,
          reason: 'Price change below threshold'
        };
      }

      // Validate price change limits
      const validatedPrice = this.validatePriceChange(currentPrice, newPrice);
      
      if (validatedPrice !== newPrice) {
        return {
          oldPrice: currentPrice,
          newPrice: validatedPrice,
          changed: validatedPrice !== currentPrice,
          reason: 'Price change limited by safety constraints'
        };
      }

      // Store previous comparison for history
      await this.priceCache.storePreviousComparison(comparison);

      // Update the price (this would update the database in real implementation)
      await this.updateProductPriceInDatabase(sku, newPrice);

      console.log(`Updated price for ${sku}: ${currentPrice} -> ${newPrice} (${marketAnalysis.market_position})`);

      return {
        oldPrice: currentPrice,
        newPrice,
        changed: true,
        reason: `Market-based adjustment (${marketAnalysis.market_position} positioning)`
      };

    } catch (error) {
      console.error(`Error updating dynamic price for ${sku}:`, error);
      throw error;
    }
  }

  private async runPricingUpdate(): Promise<void> {
    try {
      console.log('Running dynamic pricing update...');
      
      // Get products that need price updates (this would come from database)
      const products = await this.getProductsForDynamicPricing();
      
      let updatedCount = 0;
      const batchSize = 10;

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        
        const updatePromises = batch.map(async (product) => {
          try {
            const result = await this.updateProductPrice(product.sku, product.name);
            if (result.changed) {
              updatedCount++;
            }
            return result;
          } catch (error) {
            console.error(`Error updating price for ${product.sku}:`, error);
            return null;
          }
        });

        await Promise.all(updatePromises);

        // Add delay between batches
        if (i + batchSize < products.length) {
          await this.sleep(2000);
        }
      }

      console.log(`Dynamic pricing update completed: ${updatedCount} prices updated out of ${products.length} products`);

    } catch (error) {
      console.error('Error in dynamic pricing update:', error);
    }
  }

  private async calculateDynamicPrice(
    comparison: PriceComparison, 
    marketAnalysis: MarketAnalysis
  ): Promise<number> {
    const currentPrice = comparison.our_price;
    const bestCompetitorPrice = comparison.best_price.total_cost;
    const averageMarketPrice = marketAnalysis.average_market_price;
    
    // Base price calculation factors
    let targetPrice = currentPrice;

    // Factor 1: Competitor pricing influence
    if (this.config.competitor_weight > 0) {
      const competitorInfluence = (bestCompetitorPrice * 1.05) * this.config.competitor_weight; // 5% above best competitor
      targetPrice = (targetPrice * (1 - this.config.competitor_weight)) + competitorInfluence;
    }

    // Factor 2: Market average influence
    const marketInfluence = averageMarketPrice * 0.95; // 5% below market average
    targetPrice = (targetPrice * 0.7) + (marketInfluence * 0.3);

    // Factor 3: Demand-based adjustments (simplified)
    if (this.config.demand_weight > 0) {
      const demandMultiplier = await this.calculateDemandMultiplier(comparison.sku);
      targetPrice *= demandMultiplier;
    }

    // Factor 4: Inventory-based adjustments
    if (this.config.inventory_weight > 0) {
      const inventoryMultiplier = await this.calculateInventoryMultiplier(comparison.sku);
      targetPrice *= inventoryMultiplier;
    }

    // Ensure minimum margin
    const minPrice = bestCompetitorPrice * 1.02; // At least 2% above best competitor
    targetPrice = Math.max(targetPrice, minPrice);

    return Math.round(targetPrice * 100) / 100;
  }

  private validatePriceChange(currentPrice: number, newPrice: number): number {
    const changePercentage = (newPrice - currentPrice) / currentPrice;

    // Check maximum increase limit
    if (changePercentage > this.config.max_price_increase_percentage) {
      return currentPrice * (1 + this.config.max_price_increase_percentage);
    }

    // Check maximum decrease limit
    if (changePercentage < -this.config.max_price_decrease_percentage) {
      return currentPrice * (1 - this.config.max_price_decrease_percentage);
    }

    return newPrice;
  }

  private async calculateDemandMultiplier(sku: string): Promise<number> {
    // Simplified demand calculation based on recent sales/views
    // In a real implementation, this would analyze:
    // - Recent sales velocity
    // - Page views/search frequency
    // - Conversion rates
    // - Seasonal trends
    
    try {
      const recentSales = await this.getRecentSalesCount(sku, 7); // Last 7 days
      const averageSales = await this.getAverageSalesCount(sku, 30); // Last 30 days average
      
      if (averageSales === 0) return 1.0; // No historical data
      
      const demandRatio = recentSales / (averageSales / 4.3); // Weekly average
      
      // Adjust price based on demand
      if (demandRatio > 1.5) return 1.05; // High demand, increase price 5%
      if (demandRatio > 1.2) return 1.02; // Medium-high demand, increase 2%
      if (demandRatio < 0.5) return 0.95; // Low demand, decrease 5%
      if (demandRatio < 0.8) return 0.98; // Medium-low demand, decrease 2%
      
      return 1.0; // Normal demand, no change
    } catch (error) {
      console.error(`Error calculating demand multiplier for ${sku}:`, error);
      return 1.0;
    }
  }

  private async calculateInventoryMultiplier(sku: string): Promise<number> {
    // Simplified inventory-based pricing
    // In a real implementation, this would consider:
    // - Current stock levels
    // - Reorder points
    // - Supplier lead times
    // - Storage costs
    
    try {
      const stockLevel = await this.getCurrentStockLevel(sku);
      const reorderPoint = await this.getReorderPoint(sku);
      
      if (stockLevel <= 0) return 1.1; // Out of stock, increase price 10%
      if (stockLevel <= reorderPoint * 0.5) return 1.05; // Low stock, increase 5%
      if (stockLevel >= reorderPoint * 3) return 0.97; // Excess stock, decrease 3%
      
      return 1.0; // Normal stock levels
    } catch (error) {
      console.error(`Error calculating inventory multiplier for ${sku}:`, error);
      return 1.0;
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Database interaction methods (to be implemented)
  private async getProductsForDynamicPricing(): Promise<Array<{sku: string, name: string}>> {
    // TODO: Implement database query to get active products
    console.log('Getting products for dynamic pricing...');
    return []; // Placeholder
  }

  private async updateProductPriceInDatabase(sku: string, newPrice: number): Promise<void> {
    // TODO: Implement database update
    console.log(`Updating price in database for ${sku}: ${newPrice}`);
  }

  private async getRecentSalesCount(sku: string, days: number): Promise<number> {
    // TODO: Implement sales data query
    console.log(`Getting recent sales for ${sku} (${days} days)`);
    return 0; // Placeholder
  }

  private async getAverageSalesCount(sku: string, days: number): Promise<number> {
    // TODO: Implement average sales calculation
    console.log(`Getting average sales for ${sku} (${days} days)`);
    return 0; // Placeholder
  }

  private async getCurrentStockLevel(sku: string): Promise<number> {
    // TODO: Implement stock level query
    console.log(`Getting stock level for ${sku}`);
    return 10; // Placeholder
  }

  private async getReorderPoint(sku: string): Promise<number> {
    // TODO: Implement reorder point query
    console.log(`Getting reorder point for ${sku}`);
    return 5; // Placeholder
  }

  // Configuration methods
  updateConfig(newConfig: Partial<DynamicPricingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.isRunning && this.intervalId) {
      // Restart with new configuration
      this.stop();
      this.start();
    }
  }

  getConfig(): DynamicPricingConfig {
    return { ...this.config };
  }

  getStatus(): {
    isRunning: boolean;
    config: DynamicPricingConfig;
    nextUpdate?: Date;
  } {
    const nextUpdate = this.intervalId 
      ? new Date(Date.now() + this.config.update_frequency_minutes * 60 * 1000)
      : undefined;

    return {
      isRunning: this.isRunning,
      config: this.config,
      nextUpdate
    };
  }
}