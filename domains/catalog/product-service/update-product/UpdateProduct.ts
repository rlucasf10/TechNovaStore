/**
 * Caso de uso: Actualizar producto
 * 
 * Extraído de: src/services/productService.ts -> updateProduct()
 */

import { Product, IProduct } from '../shared/types/Product';
import { redisClient } from '../shared/infrastructure/redis';
import { logger } from '../shared/infrastructure/logger';

export class UpdateProduct {
  private static readonly CACHE_PREFIX = 'products:';

  static async execute(id: string, updateData: Partial<IProduct>): Promise<IProduct | null> {
    const product = await Product.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true, runValidators: true }
    );

    if (product) {
      // Recalculate price if providers were updated
      if (updateData.providers || updateData.markup_percentage) {
        (product as any).calculateOurPrice();
        await product.save();
      }
      
      // Invalidate caches
      await this.invalidateProductCaches(id);
    }

    return product;
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
