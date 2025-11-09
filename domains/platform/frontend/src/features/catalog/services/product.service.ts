/**
 * Product Service
 * 
 * Servicio para gestión de productos
 * Integración con Product_Service del backend
 */

import { axiosInstance } from '@/lib/axios';
import type { Product, PaginatedResponse, ApiResponse } from '@/types';

/**
 * Filtros para búsqueda de productos
 */
export interface ProductFilters {
  // Paginación
  page?: number;
  limit?: number;
  
  // Filtros básicos
  category?: string | string[];
  brand?: string | string[];
  search?: string;
  
  // Filtros de precio
  minPrice?: number;
  maxPrice?: number;
  
  // Filtros de disponibilidad
  inStock?: boolean;
  
  // Filtros de especificaciones técnicas
  specs?: Record<string, string | string[]>;
  
  // Ordenamiento
  sortBy?: 'price_asc' | 'price_desc' | 'name' | 'rating' | 'newest' | 'popularity';
}

/**
 * Parámetros de búsqueda de productos
 */
export interface SearchProductsParams {
  query: string;
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

class ProductService {
  private readonly baseURL = '/products';

  /**
   * Obtener lista de productos con filtros y paginación
   * 
   * @param filters - Filtros de búsqueda
   * @returns Lista paginada de productos
   * 
   * @example
   * ```typescript
   * const products = await productService.getProducts({
   *   category: 'laptops',
   *   minPrice: 500,
   *   maxPrice: 2000,
   *   sortBy: 'price_asc',
   *   page: 1,
   *   limit: 20
   * });
   * ```
   */
  async getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    const params = this.buildQueryParams(filters);
    
    const { data } = await axiosInstance.get<PaginatedResponse<Product>>(
      this.baseURL,
      { params }
    );
    
    return data;
  }

  /**
   * Obtener un producto por ID
   * 
   * @param id - ID del producto
   * @returns Producto encontrado
   * 
   * @example
   * ```typescript
   * const product = await productService.getProduct('prod_123');
   * ```
   */
  async getProduct(id: string): Promise<Product> {
    const { data } = await axiosInstance.get<ApiResponse<Product>>(
      `${this.baseURL}/${id}`
    );
    
    return data.data;
  }

  /**
   * Buscar productos por término de búsqueda
   * 
   * @param params - Parámetros de búsqueda
   * @returns Lista de productos que coinciden con la búsqueda
   * 
   * @example
   * ```typescript
   * const results = await productService.searchProducts({
   *   query: 'laptop gaming',
   *   limit: 10,
   *   category: 'laptops'
   * });
   * ```
   */
  async searchProducts(params: SearchProductsParams): Promise<Product[]> {
    const { data } = await axiosInstance.get<ApiResponse<Product[]>>(
      `${this.baseURL}/search`,
      { params }
    );
    
    return data.data;
  }

  /**
   * Obtener productos destacados
   * 
   * @param limit - Número máximo de productos a retornar
   * @returns Lista de productos destacados
   */
  async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
    const { data } = await axiosInstance.get<ApiResponse<Product[]>>(
      `${this.baseURL}/featured`,
      { params: { limit } }
    );
    
    return data.data;
  }

  /**
   * Obtener productos relacionados
   * 
   * @param productId - ID del producto
   * @param limit - Número máximo de productos a retornar
   * @returns Lista de productos relacionados
   */
  async getRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
    const { data } = await axiosInstance.get<ApiResponse<Product[]>>(
      `${this.baseURL}/${productId}/related`,
      { params: { limit } }
    );
    
    return data.data;
  }

  /**
   * Obtener productos por categoría
   * 
   * @param categorySlug - Slug de la categoría
   * @param filters - Filtros adicionales
   * @returns Lista paginada de productos
   */
  async getProductsByCategory(
    categorySlug: string,
    filters: Omit<ProductFilters, 'category'> = {}
  ): Promise<PaginatedResponse<Product>> {
    return this.getProducts({
      ...filters,
      category: categorySlug
    });
  }

  /**
   * Construir parámetros de query para la API
   * 
   * @param filters - Filtros de búsqueda
   * @returns Objeto con parámetros de query
   */
  private buildQueryParams(filters: ProductFilters): Record<string, any> {
    const params: Record<string, any> = {};

    // Paginación
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;

    // Filtros básicos
    if (filters.category) {
      params.category = Array.isArray(filters.category)
        ? filters.category.join(',')
        : filters.category;
    }
    if (filters.brand) {
      params.brand = Array.isArray(filters.brand)
        ? filters.brand.join(',')
        : filters.brand;
    }
    if (filters.search) params.search = filters.search;

    // Filtros de precio
    if (filters.minPrice !== undefined) params.min_price = filters.minPrice;
    if (filters.maxPrice !== undefined) params.max_price = filters.maxPrice;

    // Filtros de disponibilidad
    if (filters.inStock !== undefined) params.in_stock = filters.inStock;

    // Ordenamiento
    if (filters.sortBy) params.sort_by = filters.sortBy;

    // Especificaciones técnicas
    if (filters.specs) {
      Object.entries(filters.specs).forEach(([key, value]) => {
        params[`spec_${key}`] = Array.isArray(value) ? value.join(',') : value;
      });
    }

    return params;
  }
}

// Exportar instancia singleton
export const productService = new ProductService();
