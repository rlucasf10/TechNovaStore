/**
 * Caso de uso: Recuperar productos usando RAG
 * 
 * Este caso de uso implementa el pipeline RAG (Retrieval-Augmented Generation):
 * 1. Extrae keywords del mensaje del usuario
 * 2. Busca productos relevantes en la base de conocimiento
 * 3. Ordena y filtra los resultados
 * 4. Retorna los productos más relevantes
 */

import { ProductKnowledgeBase, ProductInfo } from '../shared/knowledge/ProductKnowledgeBase';
import { KeywordExtractor, ExtractedKeywords } from '../shared/rag/KeywordExtractor';
import { logger } from '../shared/utils/logger';

/** Opciones para la recuperación de productos */
export interface RetrieveProductsOptions {
  /** Número máximo de productos a devolver (default: 5) */
  limit?: number;
  /** SKUs de productos a excluir (ya mostrados previamente) */
  excludeSkus?: string[];
}

export class RetrieveProductsRAG {
  private knowledgeBase: ProductKnowledgeBase;
  private keywordExtractor: KeywordExtractor;

  constructor(
    knowledgeBase: ProductKnowledgeBase,
    keywordExtractor: KeywordExtractor
  ) {
    this.knowledgeBase = knowledgeBase;
    this.keywordExtractor = keywordExtractor;
  }

  /**
   * Extrae el número de productos solicitados del mensaje del usuario
   * Ej: "recomiendame 4 productos" -> 4
   */
  extractRequestedLimit(userMessage: string): number | null {
    // Patrones para detectar cantidad solicitada
    const patterns = [
      /(\d+)\s*productos?/i,
      /dame\s*(\d+)/i,
      /muestrame\s*(\d+)/i,
      /recomi[eé]ndame\s*(\d+)/i,
      /otros?\s*(\d+)/i,
      /(\d+)\s*m[aá]s/i,
      /(\d+)\s*opciones?/i,
      /(\d+)\s*alternativas?/i,
      /top\s*(\d+)/i,
      /los\s*(\d+)\s*mejores?/i
    ];

    for (const pattern of patterns) {
      const match = userMessage.match(pattern);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        // Limitar entre 1 y 10 productos
        if (num >= 1 && num <= 10) {
          return num;
        }
      }
    }

    return null;
  }

  /**
   * Recupera productos relevantes desde ProductKnowledgeBase usando RAG
   * @param userMessage - Mensaje del usuario
   * @param options - Opciones de recuperación (límite, exclusiones)
   */
  async execute(userMessage: string, options?: RetrieveProductsOptions): Promise<ProductInfo[]> {
    try {
      // Determinar el límite de productos
      const requestedLimit = this.extractRequestedLimit(userMessage);
      const limit = options?.limit ?? requestedLimit ?? 5;
      const excludeSkus = new Set(options?.excludeSkus || []);

      logger.debug('Parámetros RAG', { 
        requestedLimit, 
        finalLimit: limit, 
        excludeCount: excludeSkus.size 
      });

      // 1. Extraer keywords, categorías, marcas y especificaciones
      const extractedKeywords: ExtractedKeywords = this.keywordExtractor.extractKeywords(userMessage);

      logger.debug('Keywords extraídos para RAG', {
        categories: extractedKeywords.categories,
        brands: extractedKeywords.brands,
        technicalSpecs: extractedKeywords.technicalSpecs,
        generalKeywords: extractedKeywords.generalKeywords.slice(0, 5)
      });

      let products: ProductInfo[] = [];
      // Pedir más productos de los necesarios para compensar exclusiones
      const fetchLimit = limit + excludeSkus.size + 5;

      // 2. Estrategia de búsqueda priorizada

      // Estrategia 1: Búsqueda por categoría + marca (más específica)
      if (extractedKeywords.categories.length > 0 && extractedKeywords.brands.length > 0) {
        logger.debug('Búsqueda por categoría + marca');
        for (const category of extractedKeywords.categories) {
          for (const brand of extractedKeywords.brands) {
            const results = await this.knowledgeBase.searchProducts({
              category,
              brand,
              availability: true
            }, fetchLimit);

            products.push(...results);

            if (products.length >= fetchLimit) break;
          }
          if (products.length >= fetchLimit) break;
        }
      }

      // Estrategia 2: Búsqueda solo por categoría
      if (products.length < fetchLimit && extractedKeywords.categories.length > 0) {
        logger.debug('Búsqueda por categoría');
        for (const category of extractedKeywords.categories) {
          const results = await this.knowledgeBase.searchProducts({
            category,
            availability: true
          }, fetchLimit - products.length);

          products.push(...results);

          if (products.length >= fetchLimit) break;
        }
      }

      // Estrategia 3: Búsqueda solo por marca
      if (products.length < fetchLimit && extractedKeywords.brands.length > 0) {
        logger.debug('Búsqueda por marca');
        for (const brand of extractedKeywords.brands) {
          const results = await this.knowledgeBase.searchProducts({
            brand,
            availability: true
          }, fetchLimit - products.length);

          products.push(...results);

          if (products.length >= fetchLimit) break;
        }
      }

      // Estrategia 4: Búsqueda por keywords generales (fallback)
      if (products.length < fetchLimit && extractedKeywords.generalKeywords.length > 0) {
        logger.debug('Búsqueda por keywords generales');
        const searchText = extractedKeywords.generalKeywords.slice(0, 5).join(' ');
        const results = await this.knowledgeBase.searchByText(searchText, fetchLimit - products.length);
        products.push(...results);
      }

      // Estrategia 5: Si no hay productos, devolver productos populares (recomendaciones genéricas)
      if (products.length === 0) {
        logger.debug('Sin resultados específicos, devolviendo productos populares');
        const popularProducts = await this.knowledgeBase.searchProducts({
          availability: true
        }, fetchLimit);
        products.push(...popularProducts);
      }

      // 3. Eliminar duplicados (por SKU)
      const uniqueProducts = this.removeDuplicateProducts(products);

      // 4. Filtrar productos ya mostrados (excluir SKUs)
      const filteredProducts = excludeSkus.size > 0
        ? uniqueProducts.filter(p => !excludeSkus.has(p.sku))
        : uniqueProducts;

      logger.debug('Productos después de filtrar exclusiones', { 
        filtered: filteredProducts.length, 
        excluded: uniqueProducts.length - filteredProducts.length 
      });

      // 5. Ordenar por relevancia
      const sortedProducts = this.sortProductsByRelevance(filteredProducts);

      // 6. Limitar al número solicitado
      const finalProducts = sortedProducts.slice(0, limit);

      logger.debug('Productos recuperados para RAG', { 
        retrieved: finalProducts.length, 
        requested: limit 
      });

      return finalProducts;
    } catch (error) {
      logger.error('Error al recuperar productos para RAG', { 
        error: error instanceof Error ? error.message : error 
      });
      return [];
    }
  }

  /**
   * Elimina productos duplicados basándose en el SKU
   */
  private removeDuplicateProducts(products: ProductInfo[]): ProductInfo[] {
    const seenSkus = new Set<string>();
    const uniqueProducts: ProductInfo[] = [];

    for (const product of products) {
      if (!seenSkus.has(product.sku)) {
        seenSkus.add(product.sku);
        uniqueProducts.push(product);
      }
    }

    return uniqueProducts;
  }

  /**
   * Ordena productos por relevancia:
   * 1. Productos en stock primero
   * 2. Luego por precio (menor a mayor)
   */
  private sortProductsByRelevance(products: ProductInfo[]): ProductInfo[] {
    return products.sort((a, b) => {
      // Prioridad 1: Disponibilidad
      if (a.availability && !b.availability) return -1;
      if (!a.availability && b.availability) return 1;

      // Prioridad 2: Precio
      return a.price - b.price;
    });
  }
}
