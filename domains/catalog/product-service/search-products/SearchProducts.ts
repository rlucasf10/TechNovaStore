/**
 * Caso de uso: Buscar productos
 * 
 * Extraído de: src/services/productService.ts -> searchProducts()
 */

import { Product, IProduct } from '../shared/types/Product';
import { redisClient } from '../shared/infrastructure/redis';
import { logger } from '../shared/infrastructure/logger';

export class SearchProducts {
  private static readonly CACHE_TTL = 300; // 5 minutes
  private static readonly CACHE_PREFIX = 'products:search:';

  static async execute(searchTerm: string, limit: number = 10): Promise<IProduct[]> {
    const cacheKey = `${this.CACHE_PREFIX}${searchTerm}:${limit}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Cache retrieval failed:', error);
    }

    const productsDoc = await Product.find(
      { 
        $text: { $search: searchTerm },
        is_active: true 
      },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit);

    // Convert to JSON to apply transformations
    const products = productsDoc.map(p => p.toJSON());

    try {
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(products));
    } catch (error) {
      logger.warn('Cache storage failed:', error);
    }

    return products as unknown as IProduct[];
  }
}
