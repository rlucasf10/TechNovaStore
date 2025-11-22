/**
 * Caso de uso: Registrar interacción del usuario
 * 
 * Este caso de uso registra las interacciones del usuario con productos
 * para mejorar las recomendaciones futuras.
 */

import { HybridRecommender } from '../shared/algorithms/HybridRecommender';

export interface RecordInteractionRequest {
  userId: string;
  productSku: string;
  interactionType: 'view' | 'purchase' | 'cart_add' | 'wishlist' | 'search';
  metadata?: Record<string, any>;
}

export class RecordInteraction {
  private hybridRecommender: HybridRecommender;
  private redisClient: any;

  constructor(hybridRecommender: HybridRecommender, redisClient: any) {
    this.hybridRecommender = hybridRecommender;
    this.redisClient = redisClient;
  }

  async execute(request: RecordInteractionRequest): Promise<void> {
    const { userId, productSku, interactionType, metadata } = request;

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
}
