/**
 * Caso de uso: Obtener múltiples productos por IDs
 * 
 * Permite obtener varios productos en una sola consulta,
 * útil para la wishlist y otras funcionalidades que necesitan
 * cargar múltiples productos a la vez.
 */

import { Product, IProduct } from '../shared/types/Product';
import { redisClient } from '../shared/infrastructure/redis';
import { logger } from '../shared/infrastructure/logger';

export interface GetProductsBatchRequest {
  ids: string[];
}

export interface GetProductsBatchResponse {
  products: IProduct[];
  notFound: string[];
}

export class GetProductsBatch {
  private static readonly CACHE_TTL = 300; // 5 minutos
  private static readonly CACHE_PREFIX = 'products:';
  private static readonly MAX_BATCH_SIZE = 100; // Límite máximo de productos por request

  static async execute(request: GetProductsBatchRequest): Promise<GetProductsBatchResponse> {
    const { ids } = request;
    
    // Validar y limitar el tamaño del batch
    const uniqueIds = [...new Set(ids)].slice(0, this.MAX_BATCH_SIZE);
    
    if (uniqueIds.length === 0) {
      return { products: [], notFound: [] };
    }

    const products: IProduct[] = [];
    const notFound: string[] = [];
    const idsToFetch: string[] = [];

    // Intentar obtener productos del caché primero
    for (const id of uniqueIds) {
      try {
        const cacheKey = `${this.CACHE_PREFIX}${id}`;
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          products.push(JSON.parse(cached));
          logger.debug(`Product ${id} retrieved from cache`);
        } else {
          idsToFetch.push(id);
        }
      } catch (error) {
        logger.warn(`Cache retrieval failed for ${id}:`, error);
        idsToFetch.push(id);
      }
    }

    // Obtener productos no cacheados de la base de datos
    if (idsToFetch.length > 0) {
      try {
        const dbProducts = await Product.find({ _id: { $in: idsToFetch } });
        
        for (const product of dbProducts) {
          const productJSON = product.toJSON() as unknown as IProduct;
          products.push(productJSON);
          
          // Guardar en caché
          try {
            const cacheKey = `${this.CACHE_PREFIX}${product._id}`;
            await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(productJSON));
          } catch (error) {
            logger.warn(`Cache storage failed for ${product._id}:`, error);
          }
        }

        // Identificar IDs no encontrados
        const foundIds = dbProducts.map(p => (p._id as { toString(): string }).toString());
        for (const id of idsToFetch) {
          if (!foundIds.includes(id)) {
            notFound.push(id);
          }
        }
      } catch (error) {
        logger.error('Error fetching products from database:', error);
        // Si falla la DB, todos los IDs pendientes son "no encontrados"
        notFound.push(...idsToFetch);
      }
    }

    logger.info(`Batch fetch: ${products.length} found, ${notFound.length} not found`);

    return { products, notFound };
  }
}
