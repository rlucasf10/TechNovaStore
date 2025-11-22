/**
 * Caso de uso: Listar productos con filtros y paginación
 * 
 * Extraído de: src/services/productService.ts -> getProducts()
 */

import { Product, IProduct } from '../shared/types/Product';
import { redisClient } from '../shared/infrastructure/redis';
import { logger } from '../shared/infrastructure/logger';

export interface ProductQuery {
  page?: number;
  limit?: number;
  category?: string;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
}

export interface ProductResponse {
  products: IProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class ListProducts {
  private static readonly CACHE_TTL = 300; // 5 minutes
  private static readonly CACHE_PREFIX = 'products:';

  static async execute(query: ProductQuery): Promise<ProductResponse> {
    const {
      page = 1,
      limit = 20,
      category,
      subcategory,
      brand,
      minPrice,
      maxPrice,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
      isActive = true,
    } = query;

    // Build cache key
    const cacheKey = `${this.CACHE_PREFIX}list:${JSON.stringify(query)}`;
    
    try {
      // Try to get from cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug('Products retrieved from cache');
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Cache retrieval failed:', error);
    }

    // Build MongoDB query
    const filter: any = { is_active: isActive };
    
    if (category) filter.category = new RegExp(category, 'i');
    if (subcategory) filter.subcategory = new RegExp(subcategory, 'i');
    if (brand) filter.brand = new RegExp(brand, 'i');
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.our_price = {};
      if (minPrice !== undefined) filter.our_price.$gte = minPrice;
      if (maxPrice !== undefined) filter.our_price.$lte = maxPrice;
    }
    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const skip = (page - 1) * limit;
    const [productsDoc, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    // Convert to JSON to apply transformations
    const products = productsDoc.map(p => p.toJSON());

    const result: ProductResponse = {
      products: products as unknown as IProduct[],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    // Cache the result
    try {
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));
    } catch (error) {
      logger.warn('Cache storage failed:', error);
    }

    return result;
  }
}
