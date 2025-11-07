import { HybridRecommender, RecommendationResult } from '../algorithms/HybridRecommender';
import { ContentBasedFiltering } from '../algorithms/ContentBasedFiltering';
import { CollaborativeFiltering } from '../algorithms/CollaborativeFiltering';

export interface RecommendationRequest {
  userId?: string;
  sessionId?: string;
  productSku?: string;
  limit?: number;
  includeMetadata?: boolean;
  filters?: {
    category?: string;
    priceRange?: { min: number; max: number };
    brand?: string;
  };
}

export interface RecommendationResponse {
  recommendations: RecommendationResult[];
  metadata: {
    totalCount: number;
    algorithm: string;
    cacheHit: boolean;
    processingTime: number;
  };
}

export class RecommendationService {
  private hybridRecommender: HybridRecommender;
  private contentFilter: ContentBasedFiltering;
  private collaborativeFilter: CollaborativeFiltering;
  private redisClient: any; // Use any to avoid Redis type conflicts

  constructor(redisClient: any) {
    this.redisClient = redisClient;
    this.hybridRecommender = new HybridRecommender(redisClient);
    this.contentFilter = new ContentBasedFiltering();
    this.collaborativeFilter = new CollaborativeFiltering();
  }

  /**
   * Get personalized recommendations for a user
   */
  async getUserRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
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
   * Get similar products for a given product
   */
  async getSimilarProducts(request: RecommendationRequest): Promise<RecommendationResponse> {
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
      console.error('Error getting similar products:', error);
      throw error;
    }
  }

  /**
   * Get session-based recommendations
   */
  async getSessionRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
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

  /**
   * Get trending products
   */
  async getTrendingProducts(limit: number = 10): Promise<RecommendationResponse> {
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

  /**
   * Record user interaction
   */
  async recordInteraction(
    userId: string,
    productSku: string,
    interactionType: 'view' | 'purchase' | 'cart_add' | 'wishlist' | 'search',
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await this.hybridRecommender.recordInteraction(userId, productSku, interactionType, metadata);
      
      // Invalidate related caches
      await this.invalidateUserCaches(userId);
    } catch (error) {
      console.error('Error recording interaction:', error);
      throw error;
    }
  }

  /**
   * Apply filters to recommendations
   */
  private async applyFilters(
    recommendations: RecommendationResult[],
    filters: NonNullable<RecommendationRequest['filters']>
  ): Promise<RecommendationResult[]> {
    // This would typically involve querying the product database
    // For now, we'll return the recommendations as-is
    // In a real implementation, you'd filter based on product attributes
    return recommendations;
  }

  /**
   * Invalidate user-specific caches
   */
  private async invalidateUserCaches(userId: string): Promise<void> {
    try {
      const patterns = [
        `user_recs:${userId}:*`,
        `recommendations:${userId}:*`
      ];

      for (const pattern of patterns) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      }
    } catch (error) {
      console.error('Error invalidating caches:', error);
    }
  }

  /**
   * Update recommendation models (to be called periodically)
   */
  async updateModels(): Promise<void> {
    try {
      console.log('Starting model update...');
      
      // Update content-based features
      await this.contentFilter.updateProductFeatures();
      
      // Clear all caches to force fresh recommendations
      await this.redisClient.flushDb();
      
      console.log('Model update completed');
    } catch (error) {
      console.error('Error updating models:', error);
      throw error;
    }
  }

  /**
   * Get recommendation statistics
   */
  async getRecommendationStats(): Promise<{
    totalInteractions: number;
    uniqueUsers: number;
    uniqueProducts: number;
    cacheHitRate: number;
  }> {
    // This would return statistics about the recommendation system
    // Implementation would depend on your monitoring setup
    return {
      totalInteractions: 0,
      uniqueUsers: 0,
      uniqueProducts: 0,
      cacheHitRate: 0
    };
  }
}