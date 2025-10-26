import { Product, IProduct } from '../models/Product';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';

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

export class ProductService {
  private static readonly CACHE_TTL = 300; // 5 minutes
  private static readonly CACHE_PREFIX = 'products:';

  static async getProducts(query: ProductQuery): Promise<ProductResponse> {
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
    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

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

  static async getProductById(id: string): Promise<IProduct | null> {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    
    try {
      // Try cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug(`Product ${id} retrieved from cache`);
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Cache retrieval failed:', error);
    }

    const product = await Product.findById(id).lean();
    
    if (product) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(product));
      } catch (error) {
        logger.warn('Cache storage failed:', error);
      }
    }

    return product as unknown as IProduct;
  }

  static async getProductBySku(sku: string): Promise<IProduct | null> {
    const cacheKey = `${this.CACHE_PREFIX}sku:${sku}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug(`Product SKU ${sku} retrieved from cache`);
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Cache retrieval failed:', error);
    }

    const product = await Product.findOne({ sku }).lean();
    
    if (product) {
      try {
        await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(product));
      } catch (error) {
        logger.warn('Cache storage failed:', error);
      }
    }

    return product as unknown as IProduct;
  }

  static async createProduct(productData: Partial<IProduct>): Promise<IProduct> {
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

  static async updateProduct(id: string, updateData: Partial<IProduct>): Promise<IProduct | null> {
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

  static async deleteProduct(id: string): Promise<boolean> {
    const result = await Product.findByIdAndDelete(id);
    
    if (result) {
      await this.invalidateProductCaches(id);
      return true;
    }
    
    return false;
  }

  static async searchProducts(searchTerm: string, limit: number = 10): Promise<IProduct[]> {
    const cacheKey = `${this.CACHE_PREFIX}search:${searchTerm}:${limit}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Cache retrieval failed:', error);
    }

    const products = await Product.find(
      { 
        $text: { $search: searchTerm },
        is_active: true 
      },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .lean();

    try {
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(products));
    } catch (error) {
      logger.warn('Cache storage failed:', error);
    }

    return products as unknown as IProduct[];
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