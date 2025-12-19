/**
 * Caso de uso: Obtener productos relacionados
 * 
 * Implementa un algoritmo de similitud basado en múltiples factores:
 * - Categoría y subcategoría (40%)
 * - Rango de precio (25%)
 * - Marca (20%)
 * - Especificaciones técnicas (15%)
 * 
 * Extraído de: src/services/productService.ts -> getRelatedProducts()
 */

import { Product, IProduct } from '../shared/types/Product';
import { redisClient } from '../shared/infrastructure/redis';
import { logger } from '../shared/infrastructure/logger';

interface SimilarityScore {
  product: IProduct;
  score: number;
  breakdown: {
    category: number;
    price: number;
    brand: number;
    specs: number;
  };
}

export class GetRelatedProducts {
  private static readonly CACHE_TTL = 300; // 5 minutes
  private static readonly CACHE_PREFIX = 'products:related:';
  
  // Pesos para el cálculo de similitud
  private static readonly WEIGHTS = {
    category: 0.40,    // 40% - Categoría y subcategoría
    price: 0.25,       // 25% - Rango de precio
    brand: 0.20,       // 20% - Misma marca
    specs: 0.15        // 15% - Especificaciones técnicas
  };

  /**
   * Ejecuta el caso de uso para obtener productos relacionados
   * 
   * @param productId - ID del producto de referencia
   * @param limit - Número máximo de productos a retornar (default: 5)
   * @returns Lista de productos similares ordenados por score de similitud
   */
  static async execute(productId: string, limit: number = 5): Promise<IProduct[]> {
    const cacheKey = `${this.CACHE_PREFIX}${productId}:${limit}`;
    
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug(`Related products for ${productId} retrieved from cache`);
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Cache retrieval failed:', error);
    }

    // Obtener el producto de referencia
    const referenceProduct = await Product.findById(productId);
    if (!referenceProduct) {
      logger.warn(`Product ${productId} not found for related products`);
      return [];
    }

    // Buscar productos candidatos (misma categoría o subcategoría)
    const candidates = await Product.find({
      _id: { $ne: productId },
      is_active: true,
      $or: [
        { category: referenceProduct.category },
        { subcategory: referenceProduct.subcategory }
      ]
    }).limit(50); // Limitar a 50 candidatos para optimizar

    if (candidates.length === 0) {
      logger.debug(`No candidates found for product ${productId}`);
      return [];
    }

    // Calcular score de similitud para cada candidato
    const scoredProducts = candidates.map(candidate => 
      this.calculateSimilarity(referenceProduct, candidate)
    );

    // Ordenar por score descendente y tomar los top N
    const topProducts = scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.product);

    // Log para debugging
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Related products for ${productId}:`, {
        reference: {
          name: referenceProduct.name,
          category: referenceProduct.category,
          subcategory: referenceProduct.subcategory,
          brand: referenceProduct.brand,
          price: referenceProduct.our_price
        },
        results: scoredProducts.slice(0, limit).map(item => ({
          name: item.product.name,
          score: item.score.toFixed(2),
          breakdown: {
            category: item.breakdown.category.toFixed(2),
            price: item.breakdown.price.toFixed(2),
            brand: item.breakdown.brand.toFixed(2),
            specs: item.breakdown.specs.toFixed(2)
          }
        }))
      });
    }

    try {
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(topProducts));
    } catch (error) {
      logger.warn('Cache storage failed:', error);
    }

    return topProducts as unknown as IProduct[];
  }

  /**
   * Calcula el score de similitud entre dos productos
   * 
   * @param reference - Producto de referencia
   * @param candidate - Producto candidato
   * @returns Objeto con el producto y su score de similitud
   */
  private static calculateSimilarity(
    reference: any,
    candidate: any
  ): SimilarityScore {
    const categoryScore = this.calculateCategoryScore(reference, candidate);
    const priceScore = this.calculatePriceScore(reference, candidate);
    const brandScore = this.calculateBrandScore(reference, candidate);
    const specsScore = this.calculateSpecsScore(reference, candidate);

    // Calcular score total ponderado
    const totalScore = 
      categoryScore * this.WEIGHTS.category +
      priceScore * this.WEIGHTS.price +
      brandScore * this.WEIGHTS.brand +
      specsScore * this.WEIGHTS.specs;

    return {
      product: candidate.toJSON() as IProduct,
      score: totalScore,
      breakdown: {
        category: categoryScore,
        price: priceScore,
        brand: brandScore,
        specs: specsScore
      }
    };
  }

  /**
   * Calcula score de similitud de categoría (0-1)
   * - Misma categoría y subcategoría: 1.0
   * - Misma categoría, diferente subcategoría: 0.7
   * - Diferente categoría: 0.0
   */
  private static calculateCategoryScore(reference: any, candidate: any): number {
    if (reference.category === candidate.category) {
      if (reference.subcategory === candidate.subcategory) {
        return 1.0; // Categoría y subcategoría exactas
      }
      return 0.7; // Misma categoría, diferente subcategoría
    }
    return 0.0; // Diferente categoría
  }

  /**
   * Calcula score de similitud de precio (0-1)
   * Usa una función gaussiana para dar mayor score a precios cercanos
   * - Diferencia de 0%: 1.0
   * - Diferencia de 30%: 0.5
   * - Diferencia de 50%+: 0.0
   */
  private static calculatePriceScore(reference: any, candidate: any): number {
    const refPrice = reference.our_price || 0;
    const candPrice = candidate.our_price || 0;

    if (refPrice === 0 || candPrice === 0) {
      return 0.5; // Score neutral si no hay precio
    }

    // Calcular diferencia porcentual
    const priceDiff = Math.abs(refPrice - candPrice) / refPrice;

    // Función gaussiana: score alto para diferencias pequeñas
    // e^(-(diff/0.3)^2)
    const score = Math.exp(-Math.pow(priceDiff / 0.3, 2));

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calcula score de similitud de marca (0-1)
   * - Misma marca: 1.0
   * - Diferente marca: 0.0
   */
  private static calculateBrandScore(reference: any, candidate: any): number {
    if (!reference.brand || !candidate.brand) {
      return 0.5; // Score neutral si no hay marca
    }

    return reference.brand.toLowerCase() === candidate.brand.toLowerCase() ? 1.0 : 0.0;
  }

  /**
   * Calcula score de similitud de especificaciones técnicas (0-1)
   * Compara las especificaciones comunes entre ambos productos
   */
  private static calculateSpecsScore(reference: any, candidate: any): number {
    const refSpecs = reference.specifications || {};
    const candSpecs = candidate.specifications || {};

    const refKeys = Object.keys(refSpecs);
    const candKeys = Object.keys(candSpecs);

    if (refKeys.length === 0 || candKeys.length === 0) {
      return 0.5; // Score neutral si no hay specs
    }

    // Encontrar especificaciones comunes
    const commonKeys = refKeys.filter(key => candKeys.includes(key));

    if (commonKeys.length === 0) {
      return 0.0; // No hay especificaciones comunes
    }

    // Calcular cuántas especificaciones comunes tienen el mismo valor
    let matchingSpecs = 0;
    commonKeys.forEach(key => {
      const refValue = String(refSpecs[key]).toLowerCase();
      const candValue = String(candSpecs[key]).toLowerCase();
      
      if (refValue === candValue) {
        matchingSpecs++;
      } else if (this.areValuesSimilar(refValue, candValue)) {
        matchingSpecs += 0.5; // Score parcial para valores similares
      }
    });

    // Score basado en el porcentaje de specs que coinciden
    return matchingSpecs / commonKeys.length;
  }

  /**
   * Determina si dos valores de especificaciones son similares
   * (para valores numéricos con unidades, por ejemplo)
   */
  private static areValuesSimilar(value1: string, value2: string): boolean {
    // Extraer números de los valores
    const num1 = parseFloat(value1.replace(/[^0-9.]/g, ''));
    const num2 = parseFloat(value2.replace(/[^0-9.]/g, ''));

    if (isNaN(num1) || isNaN(num2)) {
      return false;
    }

    // Considerar similares si la diferencia es menor al 20%
    const diff = Math.abs(num1 - num2) / Math.max(num1, num2);
    return diff < 0.2;
  }
}
