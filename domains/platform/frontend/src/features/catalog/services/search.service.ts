/**
 * SearchService - Servicio de búsqueda global
 * 
 * Proporciona búsqueda rápida de productos, categorías y marcas
 * NO usa NLPEngine para mantener latencia baja (<500ms)
 */

import axiosInstance from '@/lib/axios';
import type { SearchResult, SearchResponse } from '@/types';

class SearchService {
  /**
   * Búsqueda global rápida
   * @param query - Término de búsqueda
   * @param limit - Número máximo de resultados (default: 10)
   * @returns Resultados agrupados por tipo
   */
  async search(query: string, limit: number = 10): Promise<SearchResponse> {
    try {
      const response = await axiosInstance.get<SearchResponse>('/products/search', {
        params: {
          q: query,
          limit,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error en búsqueda:', error);
      // Retornar resultados vacíos en caso de error
      return {
        products: [],
        categories: [],
        brands: [],
        total: 0,
      };
    }
  }

  /**
   * Búsqueda de productos con filtros
   * @param query - Término de búsqueda
   * @param filters - Filtros adicionales
   * @returns Lista de productos
   */
  async searchProducts(
    query: string,
    filters?: {
      category?: string;
      brand?: string;
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
    }
  ): Promise<SearchResult[]> {
    try {
      const response = await axiosInstance.get<{ products: SearchResult[] }>('/products/search', {
        params: {
          q: query,
          type: 'products',
          ...filters,
        },
      });

      return response.data.products;
    } catch (error) {
      console.error('Error en búsqueda de productos:', error);
      return [];
    }
  }
}

// Exportar instancia única del servicio
export const searchService = new SearchService();
