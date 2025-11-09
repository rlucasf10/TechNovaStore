/**
 * Category Service
 * 
 * Servicio para gestión de categorías de productos
 * Integración con Product_Service del backend
 */

import { axiosInstance } from '@/lib/axios';
import type { Category, ApiResponse } from '@/types';

/**
 * Categoría con subcategorías anidadas (árbol)
 */
export interface CategoryTree extends Category {
  children?: CategoryTree[];
}

class CategoryService {
  private readonly baseURL = '/categories';

  /**
   * Obtener todas las categorías
   * 
   * @returns Lista de categorías
   * 
   * @example
   * ```typescript
   * const categories = await categoryService.getCategories();
   * ```
   */
  async getCategories(): Promise<Category[]> {
    const { data } = await axiosInstance.get<ApiResponse<Category[]>>(
      this.baseURL
    );
    
    return data.data;
  }

  /**
   * Obtener una categoría por slug
   * 
   * @param slug - Slug de la categoría
   * @returns Categoría encontrada
   * 
   * @example
   * ```typescript
   * const category = await categoryService.getCategory('laptops');
   * ```
   */
  async getCategory(slug: string): Promise<Category> {
    const { data } = await axiosInstance.get<ApiResponse<Category>>(
      `${this.baseURL}/${slug}`
    );
    
    return data.data;
  }

  /**
   * Obtener una categoría por ID
   * 
   * @param id - ID de la categoría
   * @returns Categoría encontrada
   */
  async getCategoryById(id: string): Promise<Category> {
    const { data } = await axiosInstance.get<ApiResponse<Category>>(
      `${this.baseURL}/id/${id}`
    );
    
    return data.data;
  }

  /**
   * Obtener árbol de categorías (con subcategorías anidadas)
   * 
   * @returns Árbol de categorías
   * 
   * @example
   * ```typescript
   * const tree = await categoryService.getCategoryTree();
   * // Resultado:
   * // [
   * //   {
   * //     id: '1',
   * //     name: 'Computadoras',
   * //     children: [
   * //       { id: '2', name: 'Laptops', children: [] },
   * //       { id: '3', name: 'Desktops', children: [] }
   * //     ]
   * //   }
   * // ]
   * ```
   */
  async getCategoryTree(): Promise<CategoryTree[]> {
    const { data } = await axiosInstance.get<ApiResponse<CategoryTree[]>>(
      `${this.baseURL}/tree`
    );
    
    return data.data;
  }

  /**
   * Obtener categorías principales (sin padre)
   * 
   * @returns Lista de categorías principales
   */
  async getRootCategories(): Promise<Category[]> {
    const { data } = await axiosInstance.get<ApiResponse<Category[]>>(
      `${this.baseURL}/root`
    );
    
    return data.data;
  }

  /**
   * Obtener subcategorías de una categoría
   * 
   * @param parentId - ID de la categoría padre
   * @returns Lista de subcategorías
   * 
   * @example
   * ```typescript
   * const subcategories = await categoryService.getSubcategories('cat_123');
   * ```
   */
  async getSubcategories(parentId: string): Promise<Category[]> {
    const { data } = await axiosInstance.get<ApiResponse<Category[]>>(
      `${this.baseURL}/${parentId}/subcategories`
    );
    
    return data.data;
  }

  /**
   * Obtener categorías destacadas
   * 
   * @param limit - Número máximo de categorías a retornar
   * @returns Lista de categorías destacadas
   */
  async getFeaturedCategories(limit: number = 6): Promise<Category[]> {
    const { data } = await axiosInstance.get<ApiResponse<Category[]>>(
      `${this.baseURL}/featured`,
      { params: { limit } }
    );
    
    return data.data;
  }

  /**
   * Buscar categorías por nombre
   * 
   * @param query - Término de búsqueda
   * @returns Lista de categorías que coinciden
   */
  async searchCategories(query: string): Promise<Category[]> {
    const { data } = await axiosInstance.get<ApiResponse<Category[]>>(
      `${this.baseURL}/search`,
      { params: { q: query } }
    );
    
    return data.data;
  }
}

// Exportar instancia singleton
export const categoryService = new CategoryService();
