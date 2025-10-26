import { createClient, RedisClientType } from 'redis';
import { config } from '@technovastore/shared-config';
import { ProviderPrice, PriceComparison } from '../types/pricing';

export class PriceCache {
  private redis: RedisClientType;
  private defaultTTL: number = 1800; // 30 minutes in seconds

  constructor(redisUrl?: string) {
    if (redisUrl) {
      this.redis = createClient({ url: redisUrl });
    } else {
      this.redis = createClient({
        socket: {
          host: config.redis.host,
          port: config.redis.port,
        },
        password: config.redis.password,
        database: config.redis.db,
      });
    }

    this.redis.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.redis.on('connect', () => {
      console.log('Connected to Redis');
    });
  }

  async connect(): Promise<void> {
    if (!this.redis.isOpen) {
      await this.redis.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis.isOpen) {
      await this.redis.disconnect();
    }
  }

  async getPrice(sku: string, provider: string): Promise<ProviderPrice | null> {
    try {
      const key = this.getPriceKey(sku, provider);
      const cached = await this.redis.get(key);
      
      if (!cached) return null;

      const price: ProviderPrice = JSON.parse(cached);
      // Convert date strings back to Date objects
      price.last_updated = new Date(price.last_updated);
      
      return price;
    } catch (error) {
      console.error('Error getting price from cache:', error);
      return null;
    }
  }

  async setPrice(sku: string, provider: string, price: ProviderPrice, ttl?: number): Promise<void> {
    try {
      const key = this.getPriceKey(sku, provider);
      const value = JSON.stringify(price);
      
      await this.redis.setEx(key, ttl || this.defaultTTL, value);
      
      // Also store in price history
      await this.addToPriceHistory(sku, provider, price.price);
    } catch (error) {
      console.error('Error setting price in cache:', error);
    }
  }

  async getAllPrices(sku: string): Promise<ProviderPrice[]> {
    try {
      const pattern = this.getPriceKey(sku, '*');
      const keys = await this.redis.keys(pattern);
      
      if (keys.length === 0) return [];

      const values = await this.redis.mGet(keys);
      const prices: ProviderPrice[] = [];

      for (const value of values) {
        if (value) {
          const price: ProviderPrice = JSON.parse(value);
          price.last_updated = new Date(price.last_updated);
          prices.push(price);
        }
      }

      return prices;
    } catch (error) {
      console.error('Error getting all prices from cache:', error);
      return [];
    }
  }

  async deletePrice(sku: string, provider: string): Promise<void> {
    try {
      const key = this.getPriceKey(sku, provider);
      await this.redis.del(key);
    } catch (error) {
      console.error('Error deleting price from cache:', error);
    }
  }

  async deleteAllPrices(sku: string): Promise<void> {
    try {
      const pattern = this.getPriceKey(sku, '*');
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
    } catch (error) {
      console.error('Error deleting all prices from cache:', error);
    }
  }

  async cacheComparison(comparison: PriceComparison, ttl?: number): Promise<void> {
    try {
      const key = this.getComparisonKey(comparison.sku);
      const value = JSON.stringify(comparison);
      
      await this.redis.setEx(key, ttl || this.defaultTTL, value);
    } catch (error) {
      console.error('Error caching comparison:', error);
    }
  }

  async getComparison(sku: string): Promise<PriceComparison | null> {
    try {
      const key = this.getComparisonKey(sku);
      const cached = await this.redis.get(key);
      
      if (!cached) return null;

      const comparison: PriceComparison = JSON.parse(cached);
      // Convert date strings back to Date objects
      comparison.last_updated = new Date(comparison.last_updated);
      comparison.providers.forEach(p => {
        p.last_updated = new Date(p.last_updated);
      });
      
      return comparison;
    } catch (error) {
      console.error('Error getting comparison from cache:', error);
      return null;
    }
  }

  async getPreviousComparison(sku: string): Promise<PriceComparison | null> {
    try {
      const key = this.getPreviousComparisonKey(sku);
      const cached = await this.redis.get(key);
      
      if (!cached) return null;

      const comparison: PriceComparison = JSON.parse(cached);
      comparison.last_updated = new Date(comparison.last_updated);
      comparison.providers.forEach(p => {
        p.last_updated = new Date(p.last_updated);
      });
      
      return comparison;
    } catch (error) {
      console.error('Error getting previous comparison from cache:', error);
      return null;
    }
  }

  async storePreviousComparison(comparison: PriceComparison): Promise<void> {
    try {
      const key = this.getPreviousComparisonKey(comparison.sku);
      const value = JSON.stringify(comparison);
      
      // Store previous comparison for 7 days
      await this.redis.setEx(key, 7 * 24 * 60 * 60, value);
    } catch (error) {
      console.error('Error storing previous comparison:', error);
    }
  }

  async addToPriceHistory(sku: string, provider: string, price: number): Promise<void> {
    try {
      const key = this.getPriceHistoryKey(sku, provider);
      const timestamp = Date.now();
      
      // Add to sorted set with timestamp as score
      await this.redis.zAdd(key, {
        score: timestamp,
        value: JSON.stringify({ price, timestamp })
      });

      // Keep only last 100 entries
      await this.redis.zRemRangeByRank(key, 0, -101);
      
      // Set expiration for 30 days
      await this.redis.expire(key, 30 * 24 * 60 * 60);
    } catch (error) {
      console.error('Error adding to price history:', error);
    }
  }

  async getPriceHistory(sku: string, provider: string, limit: number = 50): Promise<Array<{price: number, timestamp: Date}>> {
    try {
      const key = this.getPriceHistoryKey(sku, provider);
      
      // Get latest entries
      const entries = await this.redis.zRange(key, 0, limit - 1, { REV: true });
      
      return entries.map(entry => {
        const data = JSON.parse(entry);
        return {
          price: data.price,
          timestamp: new Date(data.timestamp)
        };
      });
    } catch (error) {
      console.error('Error getting price history:', error);
      return [];
    }
  }

  async getLowestPriceInPeriod(sku: string, provider: string, hours: number): Promise<number | null> {
    try {
      const key = this.getPriceHistoryKey(sku, provider);
      const fromTimestamp = Date.now() - (hours * 60 * 60 * 1000);
      
      const entries = await this.redis.zRangeByScore(key, fromTimestamp, '+inf');
      
      if (entries.length === 0) return null;

      const prices = entries.map(entry => JSON.parse(entry).price);
      return Math.min(...prices);
    } catch (error) {
      console.error('Error getting lowest price in period:', error);
      return null;
    }
  }

  async getAveragePriceInPeriod(sku: string, provider: string, hours: number): Promise<number | null> {
    try {
      const key = this.getPriceHistoryKey(sku, provider);
      const fromTimestamp = Date.now() - (hours * 60 * 60 * 1000);
      
      const entries = await this.redis.zRangeByScore(key, fromTimestamp, '+inf');
      
      if (entries.length === 0) return null;

      const prices = entries.map(entry => JSON.parse(entry).price);
      const sum = prices.reduce((total, price) => total + price, 0);
      return sum / prices.length;
    } catch (error) {
      console.error('Error getting average price in period:', error);
      return null;
    }
  }

  async clearExpiredEntries(): Promise<void> {
    try {
      // This would be called periodically to clean up expired entries
      const pattern = 'technovastore:price:*';
      const keys = await this.redis.keys(pattern);
      
      let deletedCount = 0;
      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) { // No expiration set
          await this.redis.expire(key, this.defaultTTL);
        } else if (ttl === -2) { // Key doesn't exist
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} expired cache entries`);
      }
    } catch (error) {
      console.error('Error clearing expired entries:', error);
    }
  }

  async getCacheStats(): Promise<{
    totalKeys: number;
    priceKeys: number;
    comparisonKeys: number;
    historyKeys: number;
    memoryUsage: string;
  }> {
    try {
      const [priceKeys, comparisonKeys, historyKeys, info] = await Promise.all([
        this.redis.keys('technovastore:price:*'),
        this.redis.keys('technovastore:comparison:*'),
        this.redis.keys('technovastore:history:*'),
        this.redis.info('memory')
      ]);

      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'Unknown';

      return {
        totalKeys: priceKeys.length + comparisonKeys.length + historyKeys.length,
        priceKeys: priceKeys.length,
        comparisonKeys: comparisonKeys.length,
        historyKeys: historyKeys.length,
        memoryUsage
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalKeys: 0,
        priceKeys: 0,
        comparisonKeys: 0,
        historyKeys: 0,
        memoryUsage: 'Error'
      };
    }
  }

  // Private helper methods for generating cache keys
  private getPriceKey(sku: string, provider: string): string {
    return `technovastore:price:${sku}:${provider}`;
  }

  private getComparisonKey(sku: string): string {
    return `technovastore:comparison:${sku}`;
  }

  private getPreviousComparisonKey(sku: string): string {
    return `technovastore:comparison:previous:${sku}`;
  }

  private getPriceHistoryKey(sku: string, provider: string): string {
    return `technovastore:history:${sku}:${provider}`;
  }

  // Method to flush all cache (use with caution)
  async flushAll(): Promise<void> {
    try {
      await this.redis.flushAll();
      console.log('All cache entries cleared');
    } catch (error) {
      console.error('Error flushing cache:', error);
    }
  }
}