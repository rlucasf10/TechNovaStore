/**
 * Recommender Service
 * 
 * Servicio para obtener recomendaciones de productos
 * Integración con Product_Recommender service del backend
 */

import { axiosInstance } from '@/lib/axios';
import type { Product, ApiResponse } from '@/types';

/**
 * Parámetros para obtener recomendaciones de usuario
 */
export interface UserRecommendationsParams {
  userId?: string;
  limit?: number;
  category?: string;
}

/**
 * Parámetros para obtener recomendaciones de sesión
 */
export interface SessionRecommendationsParams {
  sessionId?: string;
  limit?: number;
  category?: string;
}

/**
 * Parámetros para obtener productos similares
 */
export interface SimilarProductsParams {
  productId: string;
  limit?: number;
}

/**
 * Respuesta del servicio de recomendaciones (solo SKUs y scores)
 */
interface RecommendationItem {
  productSku: string;
  score: number;
  source: string;
  metadata?: {
    sources: string[];
    sourceCount: number;
  };
}

class RecommenderService {
  private readonly baseURL = '/recommender';

  /**
   * Obtener productos completos a partir de una lista de SKUs
   * @param skus - Lista de SKUs de productos
   * @returns Lista de productos completos
   */
  private async fetchProductsBySku(skus: string[]): Promise<Product[]> {
    if (skus.length === 0) return [];

    try {
      // Obtener productos en paralelo
      const productPromises = skus.map(async (sku) => {
        try {
          const { data } = await axiosInstance.get<ApiResponse<Product>>(`/products/sku/${sku}`);
          return data.data;
        } catch {
          // Si no se encuentra el producto, retornar null
          return null;
        }
      });

      const products = await Promise.all(productPromises);
      // Filtrar productos nulos y mantener el orden original
      return products.filter((p): p is Product => p !== null);
    } catch {
      return [];
    }
  }

  /**
   * Obtener recomendaciones personalizadas para un usuario
   * 
   * @param params - Parámetros de recomendación
   * @returns Lista de productos recomendados
   * 
   * @example
   * ```typescript
   * const recommendations = await recommenderService.getUserRecommendations({
   *   userId: 'user_123',
   *   limit: 8
   * });
   * ```
   */
  async getUserRecommendations(params: UserRecommendationsParams = {}): Promise<Product[]> {
    try {
      // La ruta del backend es /recommendations/user/:userId
      const userId = params.userId || 'anonymous';
      const { data } = await axiosInstance.get<ApiResponse<RecommendationItem[]>>(
        `${this.baseURL}/user/${userId}`,
        { params: { limit: params.limit, category: params.category } }
      );
      
      // El backend devuelve solo SKUs, necesitamos obtener los productos completos
      const recommendations = data.data || [];
      const skus = recommendations.map(rec => rec.productSku);
      return await this.fetchProductsBySku(skus);
    } catch (error) {
      // Silenciar errores si el servicio no está disponible
      return [];
    }
  }

  /**
   * Obtener recomendaciones basadas en la sesión actual
   * 
   * @param params - Parámetros de recomendación
   * @returns Lista de productos recomendados
   * 
   * @example
   * ```typescript
   * const recommendations = await recommenderService.getSessionRecommendations({
   *   sessionId: 'session_abc',
   *   limit: 8
   * });
   * ```
   */
  async getSessionRecommendations(params: SessionRecommendationsParams = {}): Promise<Product[]> {
    try {
      // La ruta del backend es /recommendations/session/:sessionId
      const sessionId = params.sessionId || 'anonymous';
      const { data } = await axiosInstance.get<ApiResponse<RecommendationItem[]>>(
        `${this.baseURL}/session/${sessionId}`,
        { params: { limit: params.limit, category: params.category } }
      );
      
      // El backend devuelve solo SKUs, necesitamos obtener los productos completos
      const recommendations = data.data || [];
      const skus = recommendations.map(rec => rec.productSku);
      return await this.fetchProductsBySku(skus);
    } catch (error) {
      // Silenciar errores si el servicio no está disponible
      return [];
    }
  }

  /**
   * Obtener productos similares a uno dado
   * 
   * @param params - Parámetros de recomendación
   * @returns Lista de productos similares
   * 
   * @example
   * ```typescript
   * const similar = await recommenderService.getSimilarProducts({
   *   productId: 'prod_123',
   *   limit: 4
   * });
   * ```
   */
  async getSimilarProducts(params: SimilarProductsParams): Promise<Product[]> {
    try {
      // La ruta del backend es /recommendations/product/:productId/similar
      const { data } = await axiosInstance.get<ApiResponse<RecommendationItem[]>>(
        `${this.baseURL}/product/${params.productId}/similar`,
        { params: { limit: params.limit } }
      );
      
      // El backend devuelve solo SKUs, necesitamos obtener los productos completos
      const recommendations = data.data || [];
      const skus = recommendations.map(rec => rec.productSku);
      return await this.fetchProductsBySku(skus);
    } catch (error) {
      // Silenciar errores si el servicio no está disponible
      return [];
    }
  }

  /**
   * Obtener productos trending (más populares)
   * 
   * @param limit - Número máximo de productos a retornar
   * @returns Lista de productos trending
   * 
   * @example
   * ```typescript
   * const trending = await recommenderService.getTrendingProducts(8);
   * ```
   */
  async getTrendingProducts(limit: number = 8): Promise<Product[]> {
    try {
      // La ruta del backend es /recommendations/trending
      const { data } = await axiosInstance.get<ApiResponse<RecommendationItem[]>>(
        `${this.baseURL}/trending`,
        { params: { limit } }
      );
      
      // El backend devuelve solo SKUs, necesitamos obtener los productos completos
      const recommendations = data.data || [];
      const skus = recommendations.map(rec => rec.productSku);
      return await this.fetchProductsBySku(skus);
    } catch (error) {
      // Silenciar errores si el servicio no está disponible
      return [];
    }
  }

  /**
   * Registrar interacción del usuario con un producto
   * (para mejorar recomendaciones futuras)
   * 
   * @param productId - ID/SKU del producto
   * @param interactionType - Tipo de interacción
   * 
   * @example
   * ```typescript
   * await recommenderService.recordInteraction('prod_123', 'view');
   * ```
   */
  async recordInteraction(
    productId: string,
    interactionType: 'view' | 'click' | 'add_to_cart' | 'purchase'
  ): Promise<void> {
    try {
      // ✅ SEGURIDAD: NO leer token de localStorage
      // El backend obtiene el userId automáticamente de la httpOnly cookie
      // Si no hay cookie (usuario anónimo), el backend usará 'anonymous'

      // Mapear tipos de interacción del frontend al backend
      const backendInteractionType = interactionType === 'add_to_cart' ? 'cart_add' : interactionType;

      // La ruta del backend es /recommendations/interaction
      await axiosInstance.post(`${this.baseURL}/interaction`, {
        productSku: productId,
        interactionType: backendInteractionType,
        sessionId: this.getSessionId(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Silenciar errores si el servicio no está disponible
    }
  }

  /**
   * Obtener o crear un ID de sesión para tracking
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server';
    
    let sessionId = sessionStorage.getItem('recommender_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('recommender_session_id', sessionId);
    }
    return sessionId;
  }
}

// Exportar instancia singleton
export const recommenderService = new RecommenderService();
