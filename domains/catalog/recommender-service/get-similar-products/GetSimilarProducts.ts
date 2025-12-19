/**
 * Caso de uso: Obtener productos similares
 * 
 * Este caso de uso obtiene productos similares a uno dado, utilizando
 * filtrado basado en contenido para encontrar productos con características similares.
 */

import { ContentBasedFiltering } from '../shared/algorithms/ContentBasedFiltering';
import { RecommendationResult } from '../shared/algorithms/HybridRecommender';
import { logger } from '../shared/utils/logger';

export interface GetSimilarProductsRequest {
  productSku: string;
  limit?: number;
  filters?: {
    category?: string;
    priceRange?: { min: number; max: number };
    brand?: string;
  };
}

export interface GetSimilarProductsResponse {
  recommendations: RecommendationResult[];
  metadata: {
    totalCount: number;
    algorithm: string;
    cacheHit: boolean;
    processingTime: number;
  };
}

export class GetSimilarProducts {
  private contentFilter: ContentBasedFiltering;
  private redisClient: any;

  constructor(contentFilter: ContentBasedFiltering, redisClient: any) {
    this.contentFilter = contentFilter;
    this.redisClient = redisClient;
  }

  async execute(request: GetSimilarProductsRequest): Promise<GetSimilarProductsResponse> {
    const startTime = Date.now();
    const { productSku, limit = 10, filters } = request;

    if (!productSku) {
      throw new Error('Product SKU is required for similar product recommendations');
    }

    let recommendations: RecommendationResult[];
    let cacheHit = false;

    try {
      // Check cache first
      const cacheKey = `similar:${productSku}:${JSON.stringify(filters)}:${limit}`;
      const cached = await this.redisClient.get(cacheKey);
      
      if (cached) {
        recommendations = JSON.parse(cached);
        cacheHit = true;
      } else {
        const similarProducts = await this.contentFilter.getSimilarProducts(productSku, limit);
        recommendations = similarProducts.map(p => ({
          ...p,
          source: 'content' as const
        }));

        // Apply filters if provided
        if (filters) {
          recommendations = await this.applyFilters(recommendations, filters);
        }

        // Cache for 4 hours (similar products change less frequently)
        await this.redisClient.setEx(cacheKey, 14400, JSON.stringify(recommendations));
      }

      const processingTime = Date.now() - startTime;

      return {
        recommendations: recommendations.slice(0, limit),
        metadata: {
          totalCount: recommendations.length,
          algorithm: 'content_based',
          cacheHit,
          processingTime
        }
      };
    } catch (error) {
      logger.error('Error getting similar products', { 
        error: error instanceof Error ? error.message : error,
        productSku
      });
      throw error;
    }
  }

  /**
   * Apply filters to recommendations
   */
  private async applyFilters(
    recommendations: RecommendationResult[],
    filters: NonNullable<GetSimilarProductsRequest['filters']>
  ): Promise<RecommendationResult[]> {
    // This would typically involve querying the product database
    // For now, we'll return the recommendations as-is
    // In a real implementation, you'd filter based on product attributes
    return recommendations;
  }
}
