/**
 * Caso de uso: Eliminar producto
 * 
 * Extraído de: src/services/productService.ts -> deleteProduct()
 */

import { Product } from '../shared/types/Product';
import { redisClient } from '../shared/infrastructure/redis';
import { logger } from '../shared/infrastructure/logger';

export class DeleteProduct {
  private static readonly CACHE_PREFIX = 'products:';

  static async execute(id: string): Promise<boolean> {
    const result = await Product.findByIdAndDelete(id);
    
    if (result) {
      await this.invalidateProductCaches(id);
      return true;
    }
    
    return false;
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
