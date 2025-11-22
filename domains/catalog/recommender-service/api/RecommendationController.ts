/**
 * Controlador de recomendaciones
 * 
 * Maneja las peticiones HTTP para el servicio de recomendaciones
 */

import { Request, Response } from 'express';
import { GetUserRecommendations } from '../get-user-recommendations/GetUserRecommendations';
import { GetSimilarProducts } from '../get-similar-products/GetSimilarProducts';
import { GetSessionRecommendations } from '../get-session-recommendations/GetSessionRecommendations';
import { GetTrendingProducts } from '../get-trending-products/GetTrendingProducts';
import { RecordInteraction } from '../record-interaction/RecordInteraction';
import { UpdateModels } from '../update-models/UpdateModels';

export class RecommendationController {
  constructor(
    private getUserRecommendations: GetUserRecommendations,
    private getSimilarProducts: GetSimilarProducts,
    private getSessionRecommendations: GetSessionRecommendations,
    private getTrendingProducts: GetTrendingProducts,
    private recordInteraction: RecordInteraction,
    private updateModels: UpdateModels
  ) {}

  /**
   * GET /recommendations/user/:userId
   * Get personalized recommendations for a user
   */
  async handleGetUserRecommendations(req: Request, res: Response): Promise<void> {
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

      const result = await this.getUserRecommendations.execute({
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
  async handleGetSimilarProducts(req: Request, res: Response): Promise<void> {
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

      const result = await this.getSimilarProducts.execute({
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
  async handleRecordInteraction(req: Request, res: Response): Promise<void> {
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

      await this.recordInteraction.execute({
        userId,
        productSku,
        interactionType,
        metadata: interactionMetadata
      });

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
  async handleGetTrendingProducts(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10 } = req.query;

      const result = await this.getTrendingProducts.execute(Number(limit));

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
  async handleGetSessionRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { 
        limit = 5,
        currentProduct
      } = req.query;

      const result = await this.getSessionRecommendations.execute({
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
  async handleUpdateModels(req: Request, res: Response): Promise<void> {
    try {
      // In a real implementation, you'd want to authenticate this as an admin endpoint
      await this.updateModels.execute();

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
}
