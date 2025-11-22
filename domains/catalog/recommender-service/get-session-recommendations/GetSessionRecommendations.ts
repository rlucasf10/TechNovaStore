/**
 * Caso de uso: Obtener recomendaciones basadas en sesión
 * 
 * Este caso de uso obtiene recomendaciones en tiempo real basadas en la
 * actividad actual de la sesión del usuario.
 */

import { HybridRecommender, RecommendationResult } from '../shared/algorithms/HybridRecommender';

export interface GetSessionRecommendationsRequest {
  sessionId: string;
  productSku?: string;
  limit?: number;
}

export interface GetSessionRecommendationsResponse {
  recommendations: RecommendationResult[];
  metadata: {
    totalCount: number;
    algorithm: string;
    cacheHit: boolean;
    processingTime: number;
  };
}

export class GetSessionRecommendations {
  private hybridRecommender: HybridRecommender;

  constructor(hybridRecommender: HybridRecommender) {
    this.hybridRecommender = hybridRecommender;
  }

  async execute(request: GetSessionRecommendationsRequest): Promise<GetSessionRecommendationsResponse> {
    const startTime = Date.now();
    const { sessionId, productSku, limit = 10 } = request;

    if (!sessionId) {
      throw new Error('Session ID is required for session-based recommendations');
    }

    try {
      const recommendations = await this.hybridRecommender.getSessionBasedRecommendations(
        sessionId,
        productSku,
        limit
      );

      const processingTime = Date.now() - startTime;

      return {
        recommendations,
        metadata: {
          totalCount: recommendations.length,
          algorithm: 'session_based',
          cacheHit: false,
          processingTime
        }
      };
    } catch (error) {
      console.error('Error getting session recommendations:', error);
      throw error;
    }
  }
}
