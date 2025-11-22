import { UserInteraction, IUserInteraction } from '../models/UserInteraction';

export interface UserItemMatrix {
  [userId: string]: {
    [productSku: string]: number;
  };
}

export interface SimilarityMatrix {
  [userId: string]: {
    [otherUserId: string]: number;
  };
}

export class CollaborativeFiltering {
  private readonly interactionWeights = {
    view: 1,
    cart_add: 2,
    wishlist: 3,
    purchase: 5,
    search: 0.5
  };

  /**
   * Build user-item interaction matrix with weighted scores
   */
  async buildUserItemMatrix(): Promise<UserItemMatrix> {
    const interactions = await UserInteraction.find({
      timestamp: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
    }).lean();

    const matrix: UserItemMatrix = {};

    for (const interaction of interactions) {
      const userId = interaction.user_id;
      const productSku = interaction.product_sku;
      const weight = this.interactionWeights[interaction.interaction_type];

      if (!matrix[userId]) {
        matrix[userId] = {};
      }

      if (!matrix[userId][productSku]) {
        matrix[userId][productSku] = 0;
      }

      // Add weighted score, with diminishing returns for multiple interactions
      matrix[userId][productSku] += weight * Math.log(1 + (matrix[userId][productSku] || 0));
    }

    return matrix;
  }

  /**
   * Calculate cosine similarity between two users
   */
  private calculateCosineSimilarity(userA: Record<string, number>, userB: Record<string, number>): number {
    const commonItems = Object.keys(userA).filter(item => item in userB);
    
    if (commonItems.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const item of commonItems) {
      dotProduct += userA[item] * userB[item];
    }

    for (const item in userA) {
      normA += userA[item] * userA[item];
    }

    for (const item in userB) {
      normB += userB[item] * userB[item];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Find similar users using cosine similarity
   */
  async findSimilarUsers(targetUserId: string, topK: number = 50): Promise<Array<{userId: string, similarity: number}>> {
    const matrix = await this.buildUserItemMatrix();
    const targetUser = matrix[targetUserId];

    if (!targetUser) return [];

    const similarities: Array<{userId: string, similarity: number}> = [];

    for (const userId in matrix) {
      if (userId === targetUserId) continue;

      const similarity = this.calculateCosineSimilarity(targetUser, matrix[userId]);
      if (similarity > 0.1) { // Minimum similarity threshold
        similarities.push({ userId, similarity });
      }
    }

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Generate collaborative filtering recommendations
   */
  async getCollaborativeRecommendations(
    userId: string, 
    limit: number = 10
  ): Promise<Array<{productSku: string, score: number}>> {
    const matrix = await this.buildUserItemMatrix();
    const similarUsers = await this.findSimilarUsers(userId);
    
    if (similarUsers.length === 0) return [];

    const userItems = matrix[userId] || {};
    const recommendations: Record<string, number> = {};

    // Aggregate recommendations from similar users
    for (const { userId: similarUserId, similarity } of similarUsers) {
      const similarUserItems = matrix[similarUserId];

      for (const productSku in similarUserItems) {
        // Skip items the user has already interacted with
        if (productSku in userItems) continue;

        if (!recommendations[productSku]) {
          recommendations[productSku] = 0;
        }

        // Weight by similarity and interaction strength
        recommendations[productSku] += similarity * similarUserItems[productSku];
      }
    }

    return Object.entries(recommendations)
      .map(([productSku, score]) => ({ productSku, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get item-based collaborative filtering recommendations
   */
  async getItemBasedRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<Array<{productSku: string, score: number}>> {
    const matrix = await this.buildUserItemMatrix();
    const userItems = matrix[userId] || {};
    
    if (Object.keys(userItems).length === 0) return [];

    // Build item-item similarity matrix for user's items
    const itemSimilarities: Record<string, Record<string, number>> = {};
    
    for (const itemA in userItems) {
      itemSimilarities[itemA] = {};
      
      // Find users who interacted with itemA
      const usersWithItemA: Record<string, number> = {};
      for (const uid in matrix) {
        if (itemA in matrix[uid]) {
          usersWithItemA[uid] = matrix[uid][itemA];
        }
      }

      // Calculate similarity with other items
      for (const uid in matrix) {
        for (const itemB in matrix[uid]) {
          if (itemA === itemB || itemB in userItems) continue;
          
          if (!itemSimilarities[itemA][itemB]) {
            itemSimilarities[itemA][itemB] = 0;
          }

          // Jaccard similarity with weighted interactions
          if (uid in usersWithItemA) {
            itemSimilarities[itemA][itemB] += Math.min(usersWithItemA[uid], matrix[uid][itemB]);
          }
        }
      }
    }

    // Generate recommendations based on item similarities
    const recommendations: Record<string, number> = {};
    
    for (const itemA in userItems) {
      const userRating = userItems[itemA];
      
      for (const itemB in itemSimilarities[itemA]) {
        if (!recommendations[itemB]) {
          recommendations[itemB] = 0;
        }
        
        recommendations[itemB] += userRating * itemSimilarities[itemA][itemB];
      }
    }

    return Object.entries(recommendations)
      .map(([productSku, score]) => ({ productSku, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}