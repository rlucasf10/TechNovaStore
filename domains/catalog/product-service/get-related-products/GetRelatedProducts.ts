/**
 * Caso de uso: Obtener productos relacionados
 * 
 * Extraído de: src/services/productService.ts -> getRelatedProducts()
 */

import { Product, IProduct } from '../shared/types/Product';
import { redisClient } from '../shared/infrastructure/redis';
import { logger } from '../shared/infrastructure/logger';

export class GetRelatedProducts {
  private static readonly CACHE_TTL = 300; // 5 minutes
  private static readonly CACHE_PREFIX = 'products:related:';

  static async execute(productId: string, category: string, limit: number = 4): Promise<IProduct[]> {
    const cacheKey = `${this.CACHE_PREFIX}${productId}:${limit}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug(`Related products for ${productId} retrieved from cache`);
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Cache retrieval failed:', error);
    }

    // Buscar productos de la misma categoría, excluyendo el producto actual
    const productsDoc = await Product.find({
      _id: { $ne: productId },
      category: category,
      is_active: true
    })
    .sort({ created_at: -1 })
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
