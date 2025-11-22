/**
 * Caso de uso: Obtener producto por SKU
 * 
 * Extraído de: src/services/productService.ts -> getProductBySku()
 */

import { Product, IProduct } from '../shared/types/Product';
import { redisClient } from '../shared/infrastructure/redis';
import { logger } from '../shared/infrastructure/logger';

export class GetProductBySku {
  private static readonly CACHE_TTL = 300; // 5 minutes
  private static readonly CACHE_PREFIX = 'products:sku:';

  static async execute(sku: string): Promise<IProduct | null> {
    const cacheKey = `${this.CACHE_PREFIX}${sku}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug(`Product SKU ${sku} retrieved from cache`);
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Cache retrieval failed:', error);
    }

    const product = await Product.findOne({ sku });
    
    if (product) {
      // Convert to JSON to apply transformations
      const productJSON = product.toJSON();
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(productJSON));
      } catch (error) {
        logger.warn('Cache storage failed:', error);
      }
      return productJSON as unknown as IProduct;
    }

    return null;
  }
}
