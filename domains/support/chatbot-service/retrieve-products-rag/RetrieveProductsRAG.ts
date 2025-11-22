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
   * Recupera productos relevantes desde ProductKnowledgeBase usando RAG
   */
  async execute(userMessage: string): Promise<ProductInfo[]> {
    try {
      // 1. Extraer keywords, categorías, marcas y especificaciones
      const extractedKeywords: ExtractedKeywords = this.keywordExtractor.extractKeywords(userMessage);

      console.log('Keywords extraídos para RAG:', {
        categories: extractedKeywords.categories,
        brands: extractedKeywords.brands,
        technicalSpecs: extractedKeywords.technicalSpecs,
        generalKeywords: extractedKeywords.generalKeywords.slice(0, 5)
      });

      let products: ProductInfo[] = [];

      // 2. Estrategia de búsqueda priorizada

      // Estrategia 1: Búsqueda por categoría + marca (más específica)
      if (extractedKeywords.categories.length > 0 && extractedKeywords.brands.length > 0) {
        console.log('Búsqueda por categoría + marca');
        for (const category of extractedKeywords.categories) {
          for (const brand of extractedKeywords.brands) {
            const results = await this.knowledgeBase.searchProducts({
              category,
              brand,
              availability: true
            }, 5);

            products.push(...results);

            if (products.length >= 5) break;
          }
          if (products.length >= 5) break;
        }
      }

      // Estrategia 2: Búsqueda solo por categoría
      if (products.length < 5 && extractedKeywords.categories.length > 0) {
        console.log('Búsqueda por categoría');
        for (const category of extractedKeywords.categories) {
          const results = await this.knowledgeBase.searchProducts({
            category,
            availability: true
          }, 5 - products.length);

          products.push(...results);

          if (products.length >= 5) break;
        }
      }

      // Estrategia 3: Búsqueda solo por marca
      if (products.length < 5 && extractedKeywords.brands.length > 0) {
        console.log('Búsqueda por marca');
        for (const brand of extractedKeywords.brands) {
          const results = await this.knowledgeBase.searchProducts({
            brand,
            availability: true
          }, 5 - products.length);

          products.push(...results);

          if (products.length >= 5) break;
        }
      }

      // Estrategia 4: Búsqueda por keywords generales (fallback)
      if (products.length < 5 && extractedKeywords.generalKeywords.length > 0) {
        console.log('Búsqueda por keywords generales');
        const searchText = extractedKeywords.generalKeywords.slice(0, 5).join(' ');
        const results = await this.knowledgeBase.searchByText(searchText, 5 - products.length);
        products.push(...results);
      }

      // 3. Eliminar duplicados (por SKU)
      const uniqueProducts = this.removeDuplicateProducts(products);

      // 4. Ordenar por relevancia
      const sortedProducts = this.sortProductsByRelevance(uniqueProducts);

      // 5. Limitar a 5 productos máximo
      const finalProducts = sortedProducts.slice(0, 5);

      console.log(`Productos recuperados para RAG: ${finalProducts.length}`);

      return finalProducts;
    } catch (error) {
      console.error('Error recuperando productos para RAG:', error);
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
