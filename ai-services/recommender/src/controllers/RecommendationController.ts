import { Request, Response } from 'express';
import { RecommendationService } from '../services/RecommendationService';

export class RecommendationController {
  private recommendationService: RecommendationService;

  constructor(recommendationService: RecommendationService) {
    this.recommendationService = recommendationService;
  }

  /**
   * GET /recommendations/user/:userId
   * Get personalized recommendations for a user
   */
  async getUserRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { 
        limit = 10, 
        category, 
        brand, 
        minPrice, 
        maxPrice,
        includeMetadata = true 
      } = req.query;

      const filters: any = {};
      if (category) filters.category = category;
      if (brand) filters.brand = brand;
      if (minPrice || maxPrice) {
        filters.priceRange = {};
        if (minPrice) filters.priceRange.min = Number(minPrice);
        if (maxPrice) filters.priceRange.max = Number(maxPrice);
      }

      const result = await this.recommendationService.getUserRecommendations({
        userId,
        limit: Number(limit),
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        includeMetadata: includeMetadata === 'true'
      });

      res.json({
        success: true,
        data: result.recommendations,
        metadata: result.metadata
      });
    } catch (error) {
      console.error('Error in getUserRecommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user recommendations',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /recommendations/product/:productId/similar
   * Get similar products for a given product
   */
  async getSimilarProducts(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.params;
      const { 
        limit = 10,
        category,
        brand,
        minPrice,
        maxPrice
      } = req.query;

      const filters: any = {};
      if (category) filters.category = category;
      if (brand) filters.brand = brand;
      if (minPrice || maxPrice) {
        filters.priceRange = {};
        if (minPrice) filters.priceRange.min = Number(minPrice);
        if (maxPrice) filters.priceRange.max = Number(maxPrice);
      }

      const result = await this.recommendationService.getSimilarProducts({
        productSku: productId,
        limit: Number(limit),
        filters: Object.keys(filters).length > 0 ? filters : undefined
      });

      res.json({
        success: true,
        data: result.recommendations,
        metadata: result.metadata
      });
    } catch (error) {
      console.error('Error in getSimilarProducts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get similar products',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /recommendations/interaction
   * Record user interaction for improving recommendations
   */
  async recordInteraction(req: Request, res: Response): Promise<void> {
    try {
      const { 
        userId, 
        productSku, 
        interactionType, 
        sessionId,
        metadata 
      } = req.body;

      if (!userId || !productSku || !interactionType) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: userId, productSku, interactionType'
        });
        return;
      }

      const validInteractionTypes = ['view', 'purchase', 'cart_add', 'wishlist', 'search'];
      if (!validInteractionTypes.includes(interactionType)) {
        res.status(400).json({
          success: false,
          error: `Invalid interaction type. Must be one of: ${validInteractionTypes.join(', ')}`
        });
        return;
      }

      const interactionMetadata = {
        ...metadata,
        sessionId,
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent'),
        ip: req.ip
      };

      await this.recommendationService.recordInteraction(
        userId,
        productSku,
        interactionType,
        interactionMetadata
      );

      res.json({
        success: true,
        message: 'Interaction recorded successfully'
      });
    } catch (error) {
      console.error('Error in recordInteraction:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record interaction',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /recommendations/trending
   * Get trending products across the platform
   */
  async getTrendingProducts(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10 } = req.query;

      const result = await this.recommendationService.getTrendingProducts(Number(limit));

      res.json({
        success: true,
        data: result.recommendations,
        metadata: result.metadata
      });
    } catch (error) {
      console.error('Error in getTrendingProducts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get trending products',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /recommendations/session/:sessionId
   * Get session-based recommendations
   */
  async getSessionRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { 
        limit = 5,
        currentProduct
      } = req.query;

      const result = await this.recommendationService.getSessionRecommendations({
        sessionId,
        productSku: currentProduct as string,
        limit: Number(limit)
      });

      res.json({
        success: true,
        data: result.recommendations,
        metadata: result.metadata
      });
    } catch (error) {
      console.error('Error in getSessionRecommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get session recommendations',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /recommendations/models/update
   * Update recommendation models (admin endpoint)
   */
  async updateModels(req: Request, res: Response): Promise<void> {
    try {
      // In a real implementation, you'd want to authenticate this as an admin endpoint
      await this.recommendationService.updateModels();

      res.json({
        success: true,
        message: 'Recommendation models updated successfully'
      });
    } catch (error) {
      console.error('Error in updateModels:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update models',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /recommendations/stats
   * Get recommendation system statistics (admin endpoint)
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.recommendationService.getRecommendationStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getStats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}