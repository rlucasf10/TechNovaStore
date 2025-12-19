import mongoose from 'mongoose';
import { getProductModel } from '../models/Product';
import { logger } from '../utils/logger';

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

  private async initializeConnection(): Promise<void> {
    try {
      if (!this.isConnected) {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/technovastore';
        await mongoose.connect(mongoUri);
        this.isConnected = true;
        logger.info('Conectado a MongoDB para Product Knowledge Base');
      }
    } catch (error) {
      logger.error('Error al conectar a MongoDB', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  async searchProducts(query: ProductQuery, limit: number = 10): Promise<ProductInfo[]> {
    await this.initializeConnection();
    
    try {
      const Product = getProductModel();
      const mongoQuery: any = {};

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

      return products.map((product) => this.mapToProductInfo(product));
    } catch (error) {
      logger.error('Error al buscar productos', { error: error instanceof Error ? error.message : error });
      return [];
    }
  }

  async getProductBySku(sku: string): Promise<ProductInfo | null> {
    await this.initializeConnection();
    
    try {
      const Product = getProductModel();
      const product = await Product.findOne({ sku }).lean();
      
      return product ? this.mapToProductInfo(product) : null;
    } catch (error) {
      logger.error('Error al obtener producto por SKU', { error: error instanceof Error ? error.message : error });
      return null;
    }
  }

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
      const Product = getProductModel();
      const recommendations: ProductRecommendation[] = [];

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
        .limit(limit * 2)
        .lean();

      for (const product of products) {
        const productInfo = this.mapToProductInfo(product);
        let score = 0;
        let reasons: string[] = [];

        if (userPreferences.categories?.includes(productInfo.category)) {
          score += 0.3;
          reasons.push(`Coincide con tu categoría preferida: ${productInfo.category}`);
        }

        if (userPreferences.brands?.includes(productInfo.brand)) {
          score += 0.2;
          reasons.push(`Marca de tu preferencia: ${productInfo.brand}`);
        }

        if (userPreferences.priceRange) {
          const priceRange = userPreferences.priceRange.max - userPreferences.priceRange.min;
          const pricePosition = (productInfo.price - userPreferences.priceRange.min) / priceRange;
          score += (1 - pricePosition) * 0.2;
          reasons.push('Precio competitivo en tu rango');
        }

        if (productInfo.availability) {
          score += 0.1;
          reasons.push('Disponible para envío inmediato');
        }

        const specCount = Object.keys(productInfo.specifications).length;
        score += Math.min(specCount / 20, 0.2);

        if (score > 0) {
          recommendations.push({
            product: productInfo,
            score,
            reason: reasons.join(', ')
          });
        }
      }

      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      logger.error('Error al obtener recomendaciones', { error: error instanceof Error ? error.message : error });
      return [];
    }
  }

  async searchByText(searchText: string, limit: number = 10): Promise<ProductInfo[]> {
    await this.initializeConnection();
    
    try {
      const Product = getProductModel();
      
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

      return products.map((product) => this.mapToProductInfo(product));
    } catch (error) {
      logger.error('Error al buscar por texto', { error: error instanceof Error ? error.message : error });
      return [];
    }
  }

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
