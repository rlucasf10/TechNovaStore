/**
 * Caso de uso: Obtener recomendaciones personalizadas para un usuario
 * 
 * Este caso de uso obtiene recomendaciones personalizadas basadas en el historial
 * del usuario, utilizando algoritmos híbridos que combinan filtrado colaborativo,
 * basado en contenido y popularidad.
 */

import { HybridRecommender, RecommendationResult } from '../shared/algorithms/HybridRecommender';

export interface GetUserRecommendationsRequest {
  userId: string;
  limit?: number;
  filters?: {
    category?: string;
    priceRange?: { min: number; max: number };
    brand?: string;
  };
  includeMetadata?: boolean;
}

export interface GetUserRecommendationsResponse {
  recommendations: RecommendationResult[];
  metadata: {
    totalCount: number;
    algorithm: string;
    cacheHit: boolean;
    processingTime: number;
  };
}

export class GetUserRecommendations {
  private hybridRecommender: HybridRecommender;
  private redisClient: any;

  constructor(hybridRecommender: HybridRecommender, redisClient: any) {
    this.hybridRecommender = hybridRecommender;
    this.redisClient = redisClient;
  }

  async execute(request: GetUserRecommendationsRequest): Promise<GetUserRecommendationsResponse> {
    const startTime = Date.now();
    const { userId, limit = 10, filters } = request;

    if (!userId) {
      throw new Error('User ID is required for personalized recommendations');
    }

    let recommendations: RecommendationResult[];
    let algorithm = 'hybrid';
    let cacheHit = false;

    try {
      // Check cache first
      const cacheKey = `user_recs:${userId}:${JSON.stringify(filters)}:${limit}`;
      const cached = await this.redisClient.get(cacheKey);
      
      if (cached) {
        recommendations = JSON.parse(cached);
        cacheHit = true;
      } else {
        recommendations = await this.hybridRecommender.getHybridRecommendations(userId, limit);
        
        // Apply filters if provided
        if (filters) {
          recommendations = await this.applyFilters(recommendations, filters);
        }

        // Cache for 2 hours
        await this.redisClient.setEx(cacheKey, 7200, JSON.stringify(recommendations));
      }

      const processingTime = Date.now() - startTime;

      return {
        recommendations: recommendations.slice(0, limit),
        metadata: {
          totalCount: recommendations.length,
          algorithm,
          cacheHit,
          processingTime
        }
      };
    } catch (error) {
      console.error('Error getting user recommendations:', error);
      
      // Fallback to trending products
      recommendations = await this.hybridRecommender.getTrendingProducts(limit);
      algorithm = 'fallback_trending';
      
      const processingTime = Date.now() - startTime;

      return {
        recommendations,
        metadata: {
          totalCount: recommendations.length,
          algorithm,
          cacheHit: false,
          processingTime
        }
      };
    }
  }

  /**
   * Apply filters to recommendations
   */
  private async applyFilters(
    recommendations: RecommendationResult[],
    filters: NonNullable<GetUserRecommendationsRequest['filters']>
  ): Promise<RecommendationResult[]> {
    // This would typically involve querying the product database
    // For now, we'll return the recommendations as-is
    // In a real implementation, you'd filter based on product attributes
    return recommendations;
  }
}
