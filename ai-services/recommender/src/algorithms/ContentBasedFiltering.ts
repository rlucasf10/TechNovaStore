import { Product, IProductRecommender } from '../models/Product';
import { UserInteraction } from '../models/UserInteraction';

export interface ProductFeatures {
  category: number[];
  brand: number[];
  priceRange: number;
  specifications: number[];
  textFeatures: number[];
}

export class ContentBasedFiltering {
  private categoryEncoder: Map<string, number> = new Map();
  private brandEncoder: Map<string, number> = new Map();
  private specificationKeys: string[] = [];

  /**
   * Initialize encoders and feature extractors
   */
  async initialize(): Promise<void> {
    const products = await Product.find({ is_active: true }).lean();
    
    // Build category encoder
    const categories = [...new Set(products.map(p => p.category))];
    categories.forEach((cat, idx) => this.categoryEncoder.set(cat, idx));

    // Build brand encoder
    const brands = [...new Set(products.map(p => p.brand))];
    brands.forEach((brand, idx) => this.brandEncoder.set(brand, idx));

    // Extract common specification keys
    const allSpecs = products.flatMap(p => Object.keys(p.specifications || {}));
    this.specificationKeys = [...new Set(allSpecs)].slice(0, 20); // Top 20 most common specs
  }

  /**
   * Extract features from product
   */
  private extractProductFeatures(product: any): number[] {
    const features: number[] = [];

    // Category one-hot encoding
    const categoryVector = new Array(this.categoryEncoder.size).fill(0);
    const categoryIdx = this.categoryEncoder.get(product.category);
    if (categoryIdx !== undefined) {
      categoryVector[categoryIdx] = 1;
    }
    features.push(...categoryVector);

    // Brand one-hot encoding
    const brandVector = new Array(this.brandEncoder.size).fill(0);
    const brandIdx = this.brandEncoder.get(product.brand);
    if (brandIdx !== undefined) {
      brandVector[brandIdx] = 1;
    }
    features.push(...brandVector);

    // Price normalization (log scale)
    const normalizedPrice = Math.log(product.our_price + 1) / 10;
    features.push(normalizedPrice);

    // Specification features
    const specFeatures = this.specificationKeys.map(key => {
      const value = product.specifications?.[key];
      if (typeof value === 'number') {
        return Math.min(value / 1000, 1); // Normalize numeric specs
      } else if (typeof value === 'boolean') {
        return value ? 1 : 0;
      } else if (typeof value === 'string') {
        return value.length / 100; // String length as feature
      }
      return 0;
    });
    features.push(...specFeatures);

    // Text features (simple TF-IDF approximation)
    const text = `${product.name} ${product.description}`.toLowerCase();
    const words = text.split(/\s+/);
    const wordCounts = new Map<string, number>();
    
    words.forEach(word => {
      if (word.length > 2) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    });

    // Top 50 most common tech terms (simplified)
    const techTerms = [
      'processor', 'memory', 'storage', 'graphics', 'display', 'battery',
      'camera', 'wireless', 'bluetooth', 'usb', 'hdmi', 'gaming',
      'professional', 'portable', 'desktop', 'laptop', 'tablet', 'smartphone'
    ];

    const textFeatures = techTerms.map(term => {
      const count = wordCounts.get(term) || 0;
      return Math.min(count / words.length, 0.1) * 10; // TF normalization
    });
    features.push(...textFeatures);

    return features;
  }

  /**
   * Calculate cosine similarity between two feature vectors
   */
  private calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Build user profile based on interaction history
   */
  async buildUserProfile(userId: string): Promise<number[]> {
    const interactions = await UserInteraction.find({
      user_id: userId,
      timestamp: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } // Last 60 days
    }).lean();

    if (interactions.length === 0) return [];

    const productSkus = interactions.map(i => i.product_sku);
    const products = await Product.find({ 
      sku: { $in: productSkus },
      is_active: true 
    }).lean();

    if (products.length === 0) return [];

    // Initialize feature vector
    const sampleFeatures = this.extractProductFeatures(products[0] as any);
    const profileVector = new Array(sampleFeatures.length).fill(0);

    // Weight interactions and aggregate features
    const interactionWeights = {
      view: 1,
      cart_add: 2,
      wishlist: 3,
      purchase: 5,
      search: 0.5
    };

    let totalWeight = 0;

    for (const interaction of interactions) {
      const product = products.find(p => p.sku === interaction.product_sku);
      if (!product) continue;

      const features = this.extractProductFeatures(product as any);
      const weight = interactionWeights[interaction.interaction_type];

      for (let i = 0; i < features.length; i++) {
        profileVector[i] += features[i] * weight;
      }
      totalWeight += weight;
    }

    // Normalize by total weight
    if (totalWeight > 0) {
      for (let i = 0; i < profileVector.length; i++) {
        profileVector[i] /= totalWeight;
      }
    }

    return profileVector;
  }

  /**
   * Get content-based recommendations for a user
   */
  async getContentBasedRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<Array<{productSku: string, score: number}>> {
    await this.initialize();

    const userProfile = await this.buildUserProfile(userId);
    if (userProfile.length === 0) return [];

    // Get user's interaction history to exclude already seen products
    const userInteractions = await UserInteraction.find({ user_id: userId }).distinct('product_sku');

    // Get all active products
    const products = await Product.find({ 
      is_active: true,
      sku: { $nin: userInteractions }
    }).lean();

    const recommendations: Array<{productSku: string, score: number}> = [];

    for (const product of products) {
      const productFeatures = this.extractProductFeatures(product as any);
      const similarity = this.calculateCosineSimilarity(userProfile, productFeatures);
      
      if (similarity > 0.1) { // Minimum similarity threshold
        recommendations.push({
          productSku: product.sku,
          score: similarity
        });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Find similar products based on content features
   */
  async getSimilarProducts(
    productSku: string,
    limit: number = 10
  ): Promise<Array<{productSku: string, score: number}>> {
    await this.initialize();

    const targetProduct = await Product.findOne({ sku: productSku, is_active: true }).lean();
    if (!targetProduct) return [];

    const targetFeatures = this.extractProductFeatures(targetProduct as any);

    // Get products from same category for efficiency
    const candidateProducts = await Product.find({
      is_active: true,
      sku: { $ne: productSku },
      $or: [
        { category: targetProduct.category },
        { brand: targetProduct.brand }
      ]
    }).lean();

    const similarities: Array<{productSku: string, score: number}> = [];

    for (const product of candidateProducts) {
      const productFeatures = this.extractProductFeatures(product as any);
      const similarity = this.calculateCosineSimilarity(targetFeatures, productFeatures);
      
      if (similarity > 0.2) { // Higher threshold for product similarity
        similarities.push({
          productSku: product.sku,
          score: similarity
        });
      }
    }

    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Update product features in database
   */
  async updateProductFeatures(): Promise<void> {
    await this.initialize();

    const products = await Product.find({ is_active: true });
    
    for (const product of products) {
      const features = this.extractProductFeatures(product as any);
      await Product.updateOne(
        { _id: product._id },
        { $set: { features } }
      );
    }
  }
}