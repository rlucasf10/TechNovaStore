/**
 * Caso de uso: Obtener productos en tendencia
 * 
 * Este caso de uso obtiene los productos más populares y en tendencia
 * basándose en las interacciones recientes de todos los usuarios.
 */

import { HybridRecommender, RecommendationResult } from '../shared/algorithms/HybridRecommender';

export interface GetTrendingProductsResponse {
  recommendations: RecommendationResult[];
  metadata: {
    totalCount: number;
    algorithm: string;
    cacheHit: boolean;
    processingTime: number;
  };
}

export class GetTrendingProducts {
  private hybridRecommender: HybridRecommender;

  constructor(hybridRecommender: HybridRecommender) {
    this.hybridRecommender = hybridRecommender;
  }

  async execute(limit: number = 10): Promise<GetTrendingProductsResponse> {
    const startTime = Date.now();

    try {
      const recommendations = await this.hybridRecommender.getTrendingProducts(limit);
      const processingTime = Date.now() - startTime;

      return {
        recommendations,
        metadata: {
          totalCount: recommendations.length,
          algorithm: 'trending',
          cacheHit: false,
          processingTime
        }
      };
    } catch (error) {
      console.error('Error getting trending products:', error);
      throw error;
    }
  }
}
