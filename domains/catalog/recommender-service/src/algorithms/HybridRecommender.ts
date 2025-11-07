import { CollaborativeFiltering } from './CollaborativeFiltering';
import { ContentBasedFiltering } from './ContentBasedFiltering';
import { UserInteraction } from '../models/UserInteraction';
import { Product } from '../models/Product';
import { RedisClientType } from 'redis';

export interface RecommendationResult {
  productSku: string;
  score: number;
  source: 'collaborative' | 'content' | 'hybrid' | 'popularity' | 'trending';
  metadata?: Record<string, any>;
}

export class HybridRecommender {
  private collaborativeFilter: CollaborativeFiltering;
  private contentFilter: ContentBasedFiltering;
  private redisClient: any; // Use any to avoid Redis type conflicts

  constructor(redisClient: any) {
    this.collaborativeFilter = new CollaborativeFiltering();
    this.contentFilter = new ContentBasedFiltering();
    this.redisClient = redisClient;
  }

  /**
   * Get hybrid recommendations combining multiple algorithms
   */
  async getHybridRecommendations(
    userId: string,
    limit: number = 10,
    options: {
      collaborativeWeight?: number;
      contentWeight?: number;
      popularityWeight?: number;
      diversityFactor?: number;
    } = {}
  ): Promise<RecommendationResult[]> {
    const {
      collaborativeWeight = 0.4,
      contentWeight = 0.4,
      popularityWeight = 0.2,
      diversityFactor = 0.3
    } = options;

    // Check cache first
    const cacheKey = `recommendations:${userId}:${limit}`;
    const cached = await this.redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get user interaction count to determine strategy
    const userInteractionCount = await UserInteraction.countDocuments({ user_id: userId });
    
    let recommendations: RecommendationResult[] = [];

    if (userInteractionCount < 5) {
      // Cold start: use popularity-based recommendations
      recommendations = await this.getPopularityBasedRecommendations(limit);
    } else if (userInteractionCount < 20) {
      // Warm start: emphasize content-based with some collaborative
      const contentRecs = await this.contentFilter.getContentBasedRecommendations(userId, Math.ceil(limit * 0.7));
      const collaborativeRecs = await this.collaborativeFilter.getCollaborativeRecommendations(userId, Math.ceil(limit * 0.3));
      const popularityRecs = await this.getPopularityBasedRecommendations(Math.ceil(limit * 0.2));

      recommendations = this.combineRecommendations([
        { recommendations: contentRecs.map(r => ({ ...r, source: 'content' as const })), weight: 0.5 },
        { recommendations: collaborativeRecs.map(r => ({ ...r, source: 'collaborative' as const })), weight: 0.3 },
        { recommendations: popularityRecs, weight: 0.2 }
      ], limit);
    } else {
      // Full hybrid approach
      const [contentRecs, collaborativeRecs, itemBasedRecs, popularityRecs] = await Promise.all([
        this.contentFilter.getContentBasedRecommendations(userId, limit),
        this.collaborativeFilter.getCollaborativeRecommendations(userId, limit),
        this.collaborativeFilter.getItemBasedRecommendations(userId, limit),
        this.getPopularityBasedRecommendations(Math.ceil(limit * 0.3))
      ]);

      recommendations = this.combineRecommendations([
        { recommendations: contentRecs.map(r => ({ ...r, source: 'content' as const })), weight: contentWeight },
        { recommendations: collaborativeRecs.map(r => ({ ...r, source: 'collaborative' as const })), weight: collaborativeWeight * 0.6 },
        { recommendations: itemBasedRecs.map(r => ({ ...r, source: 'collaborative' as const })), weight: collaborativeWeight * 0.4 },
        { recommendations: popularityRecs, weight: popularityWeight }
      ], limit);
    }

    // Apply diversity filter
    if (diversityFactor > 0) {
      recommendations = await this.applyDiversityFilter(recommendations, diversityFactor);
    }

    // Cache results for 1 hour
    await this.redisClient.setEx(cacheKey, 3600, JSON.stringify(recommendations));

    return recommendations.slice(0, limit);
  }

  /**
   * Combine multiple recommendation sources with weights
   */
  private combineRecommendations(
    sources: Array<{
      recommendations: Array<{productSku: string, score: number, source: string}>,
      weight: number
    }>,
    limit: number
  ): RecommendationResult[] {
    const combinedScores = new Map<string, {score: number, sources: string[]}>();

    // Normalize scores within each source
    for (const source of sources) {
      const maxScore = Math.max(...source.recommendations.map(r => r.score), 1);
      
      for (const rec of source.recommendations) {
        const normalizedScore = (rec.score / maxScore) * source.weight;
        const existing = combinedScores.get(rec.productSku);
        
        if (existing) {
          existing.score += normalizedScore;
          existing.sources.push(rec.source);
        } else {
          combinedScores.set(rec.productSku, {
            score: normalizedScore,
            sources: [rec.source]
          });
        }
      }
    }

    // Convert to result format and sort
    const results: RecommendationResult[] = Array.from(combinedScores.entries())
      .map(([productSku, data]) => ({
        productSku,
        score: data.score,
        source: data.sources.length > 1 ? 'hybrid' as const : data.sources[0] as any,
        metadata: {
          sources: data.sources,
          sourceCount: data.sources.length
        }
      }))
      .sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }

  /**
   * Get popularity-based recommendations for cold start
   */
  private async getPopularityBasedRecommendations(limit: number): Promise<RecommendationResult[]> {
    // Get trending products based on recent interactions
    const trendingProducts = await UserInteraction.aggregate([
      {
        $match: {
          timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
          interaction_type: { $in: ['purchase', 'cart_add', 'view'] }
        }
      },
      {
        $group: {
          _id: '$product_sku',
          interactionCount: { $sum: 1 },
          purchaseCount: {
            $sum: { $cond: [{ $eq: ['$interaction_type', 'purchase'] }, 1, 0] }
          },
          viewCount: {
            $sum: { $cond: [{ $eq: ['$interaction_type', 'view'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          popularityScore: {
            $add: [
              { $multiply: ['$purchaseCount', 5] },
              { $multiply: ['$viewCount', 1] },
              '$interactionCount'
            ]
          }
        }
      },
      { $sort: { popularityScore: -1 } },
      { $limit: limit * 2 } // Get more to filter active products
    ]);

    // Filter for active products
    const productSkus = trendingProducts.map(p => p._id);
    const activeProducts = await Product.find({
      sku: { $in: productSkus },
      is_active: true
    }).select('sku').lean();

    const activeSkus = new Set(activeProducts.map(p => p.sku));

    return trendingProducts
      .filter(p => activeSkus.has(p._id))
      .slice(0, limit)
      .map(p => ({
        productSku: p._id,
        score: p.popularityScore / 100, // Normalize score
        source: 'popularity' as const,
        metadata: {
          interactionCount: p.interactionCount,
          purchaseCount: p.purchaseCount
        }
      }));
  }

  /**
   * Apply diversity filter to avoid too similar recommendations
   */
  private async applyDiversityFilter(
    recommendations: RecommendationResult[],
    diversityFactor: number
  ): Promise<RecommendationResult[]> {
    if (recommendations.length <= 1) return recommendations;

    const productSkus = recommendations.map(r => r.productSku);
    const products = await Product.find({
      sku: { $in: productSkus }
    }).select('sku category brand').lean();

    const productMap = new Map(products.map(p => [p.sku, p]));
    const diverseRecommendations: RecommendationResult[] = [];
    const usedCategories = new Set<string>();
    const usedBrands = new Set<string>();

    // First pass: add high-scoring items from different categories/brands
    for (const rec of recommendations) {
      const product = productMap.get(rec.productSku);
      if (!product) continue;

      const categoryPenalty = usedCategories.has(product.category) ? diversityFactor : 0;
      const brandPenalty = usedBrands.has(product.brand) ? diversityFactor * 0.5 : 0;
      
      rec.score = rec.score * (1 - categoryPenalty - brandPenalty);
      
      diverseRecommendations.push(rec);
      usedCategories.add(product.category);
      usedBrands.add(product.brand);
    }

    return diverseRecommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Get trending products across the platform
   */
  async getTrendingProducts(limit: number = 10): Promise<RecommendationResult[]> {
    const cacheKey = `trending:products:${limit}`;
    const cached = await this.redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const trending = await this.getPopularityBasedRecommendations(limit);
    const results = trending.map(t => ({ ...t, source: 'trending' as const }));

    // Cache for 30 minutes
    await this.redisClient.setEx(cacheKey, 1800, JSON.stringify(results));

    return results;
  }

  /**
   * Record user interaction for improving recommendations
   */
  async recordInteraction(
    userId: string,
    productSku: string,
    interactionType: 'view' | 'purchase' | 'cart_add' | 'wishlist' | 'search',
    metadata?: Record<string, any>
  ): Promise<void> {
    await UserInteraction.create({
      user_id: userId,
      product_sku: productSku,
      interaction_type: interactionType,
      timestamp: new Date(),
      metadata
    });

    // Invalidate user's recommendation cache
    const cachePattern = `recommendations:${userId}:*`;
    const keys = await this.redisClient.keys(cachePattern);
    if (keys.length > 0) {
      await this.redisClient.del(keys);
    }
  }

  /**
   * Get real-time recommendations based on current session
   */
  async getSessionBasedRecommendations(
    sessionId: string,
    currentProductSku?: string,
    limit: number = 5
  ): Promise<RecommendationResult[]> {
    // Get session interactions
    const sessionInteractions = await UserInteraction.find({
      session_id: sessionId,
      timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    }).lean();

    if (sessionInteractions.length === 0 && !currentProductSku) {
      return this.getTrendingProducts(limit);
    }

    let recommendations: RecommendationResult[] = [];

    // If viewing a specific product, get similar products
    if (currentProductSku) {
      const similarProducts = await this.contentFilter.getSimilarProducts(currentProductSku, limit);
      recommendations = similarProducts.map(p => ({
        ...p,
        source: 'content' as const
      }));
    }

    // Add recommendations based on session history
    if (sessionInteractions.length > 0) {
      const viewedProducts = sessionInteractions.map(i => i.product_sku);
      const sessionRecs = await this.getRecommendationsForProducts(viewedProducts, limit);
      recommendations = [...recommendations, ...sessionRecs];
    }

    // Remove duplicates and sort
    const uniqueRecs = new Map<string, RecommendationResult>();
    for (const rec of recommendations) {
      if (!uniqueRecs.has(rec.productSku) || uniqueRecs.get(rec.productSku)!.score < rec.score) {
        uniqueRecs.set(rec.productSku, rec);
      }
    }

    return Array.from(uniqueRecs.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get recommendations based on a list of products
   */
  private async getRecommendationsForProducts(
    productSkus: string[],
    limit: number
  ): Promise<RecommendationResult[]> {
    const allRecommendations: RecommendationResult[] = [];

    for (const sku of productSkus) {
      const similar = await this.contentFilter.getSimilarProducts(sku, Math.ceil(limit / productSkus.length));
      allRecommendations.push(...similar.map(p => ({
        ...p,
        source: 'content' as const
      })));
    }

    // Aggregate and deduplicate
    const scoreMap = new Map<string, number>();
    for (const rec of allRecommendations) {
      const existing = scoreMap.get(rec.productSku) || 0;
      scoreMap.set(rec.productSku, Math.max(existing, rec.score));
    }

    return Array.from(scoreMap.entries())
      .map(([productSku, score]) => ({
        productSku,
        score,
        source: 'content' as const
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}