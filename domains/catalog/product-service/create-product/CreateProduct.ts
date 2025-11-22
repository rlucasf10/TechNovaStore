/**
 * Caso de uso: Crear producto
 * 
 * Extraído de: src/services/productService.ts -> createProduct()
 */

import { Product, IProduct } from '../shared/types/Product';
import { redisClient } from '../shared/infrastructure/redis';
import { logger } from '../shared/infrastructure/logger';

export class CreateProduct {
  private static readonly CACHE_PREFIX = 'products:';

  static async execute(productData: Partial<IProduct>): Promise<IProduct> {
    const product = new Product(productData);
    
    // Calculate our price based on providers
    if (product.providers && product.providers.length > 0) {
      (product as any).calculateOurPrice();
    }
    
    const savedProduct = await product.save();
    
    // Invalidate related caches
    await this.invalidateProductCaches((savedProduct._id as any).toString());
    
    return savedProduct;
  }

  private static async invalidateProductCaches(_productId: string): Promise<void> {
    try {
      const keys = await redisClient.keys(`${this.CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      logger.warn('Cache invalidation failed:', error);
    }
  }
}
