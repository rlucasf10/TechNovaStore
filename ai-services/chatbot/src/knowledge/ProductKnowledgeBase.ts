import mongoose from 'mongoose';

export interface ProductInfo {
  sku: string;
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  description: string;
  specifications: { [key: string]: any };
  price: number;
  availability: boolean;
  images: string[];
  keywords: string[];
  features: string[];
  compatibilities: string[];
  useCases: string[];
}

export interface ProductQuery {
  category?: string;
  brand?: string;
  priceRange?: { min: number; max: number };
  features?: string[];
  keywords?: string[];
  availability?: boolean;
}

export interface ProductRecommendation {
  product: ProductInfo;
  score: number;
  reason: string;
}

export class ProductKnowledgeBase {
  private isConnected: boolean = false;

  constructor() {
    this.initializeConnection();
  }

  /**
   * Initialize MongoDB connection
   */
  private async initializeConnection(): Promise<void> {
    try {
      if (!this.isConnected) {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/technovastore';
        await mongoose.connect(mongoUri);
        this.isConnected = true;
        console.log('Connected to MongoDB for Product Knowledge Base');
      }
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Search products based on query parameters
   */
  async searchProducts(query: ProductQuery, limit: number = 10): Promise<ProductInfo[]> {
    await this.initializeConnection();
    
    try {
      const Product = mongoose.model('Product');
      const mongoQuery: any = {};

      // Build MongoDB query
      if (query.category) {
        mongoQuery.category = new RegExp(query.category, 'i');
      }

      if (query.brand) {
        mongoQuery.brand = new RegExp(query.brand, 'i');
      }

      if (query.priceRange) {
        mongoQuery.our_price = {
          $gte: query.priceRange.min,
          $lte: query.priceRange.max
        };
      }

      if (query.availability !== undefined) {
        mongoQuery.is_active = query.availability;
      }

      if (query.keywords && query.keywords.length > 0) {
        mongoQuery.$or = [
          { name: { $regex: query.keywords.join('|'), $options: 'i' } },
          { description: { $regex: query.keywords.join('|'), $options: 'i' } },
          { 'specifications.keywords': { $in: query.keywords } }
        ];
      }

      const products = await Product.find(mongoQuery)
        .limit(limit)
        .sort({ our_price: 1 })
        .lean();

      return products.map(this.mapToProductInfo);
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  /**
   * Get product by SKU
   */
  async getProductBySku(sku: string): Promise<ProductInfo | null> {
    await this.initializeConnection();
    
    try {
      const Product = mongoose.model('Product');
      const product = await Product.findOne({ sku }).lean();
      
      return product ? this.mapToProductInfo(product) : null;
    } catch (error) {
      console.error('Error getting product by SKU:', error);
      return null;
    }
  }

  /**
   * Get product recommendations based on user preferences
   */
  async getRecommendations(
    userPreferences: {
      categories?: string[];
      brands?: string[];
      priceRange?: { min: number; max: number };
      previousPurchases?: string[];
    },
    limit: number = 5
  ): Promise<ProductRecommendation[]> {
    await this.initializeConnection();
    
    try {
      const Product = mongoose.model('Product');
      const recommendations: ProductRecommendation[] = [];

      // Get products based on preferences
      const query: any = { is_active: true };

      if (userPreferences.categories && userPreferences.categories.length > 0) {
        query.category = { $in: userPreferences.categories };
      }

      if (userPreferences.brands && userPreferences.brands.length > 0) {
        query.brand = { $in: userPreferences.brands };
      }

      if (userPreferences.priceRange) {
        query.our_price = {
          $gte: userPreferences.priceRange.min,
          $lte: userPreferences.priceRange.max
        };
      }

      const products = await Product.find(query)
        .limit(limit * 2) // Get more products to score and filter
        .lean();

      // Score products based on various factors
      for (const product of products) {
        const productInfo = this.mapToProductInfo(product);
        let score = 0;
        let reasons: string[] = [];

        // Category preference scoring
        if (userPreferences.categories?.includes(productInfo.category)) {
          score += 0.3;
          reasons.push(`Coincide con tu categoría preferida: ${productInfo.category}`);
        }

        // Brand preference scoring
        if (userPreferences.brands?.includes(productInfo.brand)) {
          score += 0.2;
          reasons.push(`Marca de tu preferencia: ${productInfo.brand}`);
        }

        // Price range scoring
        if (userPreferences.priceRange) {
          const priceRange = userPreferences.priceRange.max - userPreferences.priceRange.min;
          const pricePosition = (productInfo.price - userPreferences.priceRange.min) / priceRange;
          score += (1 - pricePosition) * 0.2; // Lower prices get higher scores
          reasons.push('Precio competitivo en tu rango');
        }

        // Availability bonus
        if (productInfo.availability) {
          score += 0.1;
          reasons.push('Disponible para envío inmediato');
        }

        // Popularity scoring (based on specifications richness)
        const specCount = Object.keys(productInfo.specifications).length;
        score += Math.min(specCount / 20, 0.2); // Max 0.2 points for detailed specs

        if (score > 0) {
          recommendations.push({
            product: productInfo,
            score,
            reason: reasons.join(', ')
          });
        }
      }

      // Sort by score and return top recommendations
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  /**
   * Get similar products based on a reference product
   */
  async getSimilarProducts(referenceSku: string, limit: number = 5): Promise<ProductInfo[]> {
    await this.initializeConnection();
    
    try {
      const referenceProduct = await this.getProductBySku(referenceSku);
      if (!referenceProduct) {
        return [];
      }

      const query: ProductQuery = {
        category: referenceProduct.category,
        priceRange: {
          min: referenceProduct.price * 0.7,
          max: referenceProduct.price * 1.3
        },
        availability: true
      };

      const similarProducts = await this.searchProducts(query, limit + 1);
      
      // Remove the reference product from results
      return similarProducts.filter(product => product.sku !== referenceSku);
    } catch (error) {
      console.error('Error getting similar products:', error);
      return [];
    }
  }

  /**
   * Get product categories and their counts
   */
  async getCategories(): Promise<{ category: string; count: number }[]> {
    await this.initializeConnection();
    
    try {
      const Product = mongoose.model('Product');
      const categories = await Product.aggregate([
        { $match: { is_active: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      return categories.map(cat => ({
        category: cat._id,
        count: cat.count
      }));
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  /**
   * Get product brands and their counts
   */
  async getBrands(): Promise<{ brand: string; count: number }[]> {
    await this.initializeConnection();
    
    try {
      const Product = mongoose.model('Product');
      const brands = await Product.aggregate([
        { $match: { is_active: true } },
        { $group: { _id: '$brand', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      return brands.map(brand => ({
        brand: brand._id,
        count: brand.count
      }));
    } catch (error) {
      console.error('Error getting brands:', error);
      return [];
    }
  }

  /**
   * Search products by text query using full-text search
   */
  async searchByText(searchText: string, limit: number = 10): Promise<ProductInfo[]> {
    await this.initializeConnection();
    
    try {
      const Product = mongoose.model('Product');
      
      // Use MongoDB text search if available, otherwise use regex
      const products = await Product.find({
        $and: [
          { is_active: true },
          {
            $or: [
              { name: { $regex: searchText, $options: 'i' } },
              { description: { $regex: searchText, $options: 'i' } },
              { brand: { $regex: searchText, $options: 'i' } },
              { category: { $regex: searchText, $options: 'i' } }
            ]
          }
        ]
      })
      .limit(limit)
      .sort({ our_price: 1 })
      .lean();

      return products.map(this.mapToProductInfo);
    } catch (error) {
      console.error('Error searching by text:', error);
      return [];
    }
  }

  /**
   * Map MongoDB document to ProductInfo interface
   */
  private mapToProductInfo(product: any): ProductInfo {
    return {
      sku: product.sku || '',
      name: product.name || '',
      category: product.category || '',
      subcategory: product.subcategory || '',
      brand: product.brand || '',
      description: product.description || '',
      specifications: product.specifications || {},
      price: product.our_price || 0,
      availability: product.is_active || false,
      images: product.images || [],
      keywords: this.extractKeywordsFromProduct(product),
      features: this.extractFeaturesFromProduct(product),
      compatibilities: product.specifications?.compatibility || [],
      useCases: product.specifications?.use_cases || []
    };
  }

  /**
   * Extract keywords from product data
   */
  private extractKeywordsFromProduct(product: any): string[] {
    const keywords: string[] = [];
    
    if (product.name) {
      keywords.push(...product.name.toLowerCase().split(' '));
    }
    
    if (product.brand) {
      keywords.push(product.brand.toLowerCase());
    }
    
    if (product.category) {
      keywords.push(product.category.toLowerCase());
    }
    
    if (product.specifications?.keywords) {
      keywords.push(...product.specifications.keywords);
    }
    
    return [...new Set(keywords)].filter(keyword => keyword.length > 2);
  }

  /**
   * Extract features from product specifications
   */
  private extractFeaturesFromProduct(product: any): string[] {
    const features: string[] = [];
    
    if (product.specifications) {
      Object.entries(product.specifications).forEach(([key, value]) => {
        if (typeof value === 'string' && value.length > 0) {
          features.push(`${key}: ${value}`);
        }
      });
    }
    
    return features;
  }
}