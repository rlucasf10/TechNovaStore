/**
 * useProducts Hook
 * 
 * React Query hooks para gestión de productos
 * Integración con ProductService
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { productService, type ProductFiltersService, type SearchProductsParams } from '@/catalog';
import type { Product, PaginatedResponse } from '@/types';

/**
 * Hook para obtener lista de productos con filtros
 * 
 * @param filters - Filtros de búsqueda
 * @param options - Opciones de React Query
 * @returns Query con lista paginada de productos
 * 
 * @example
 * ```typescript
 * const { data, isLoading, error } = useProducts({
 *   category: 'laptops',
 *   minPrice: 500,
 *   maxPrice: 2000,
 *   sortBy: 'price_asc',
 *   page: 1,
 *   limit: 20
 * });
 * ```
 */
export function useProducts(
  filters: Partial<ProductFiltersService> = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<Product>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productService.getProducts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    ...options,
  });
}

/**
 * Hook para obtener un producto por ID
 * 
 * @param id - ID del producto
 * @param options - Opciones de React Query
 * @returns Query con el producto
 * 
 * @example
 * ```typescript
 * const { data: product, isLoading } = useProduct('prod_123');
 * ```
 */
export function useProduct(
  id: string,
  options?: Omit<UseQueryOptions<Product>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getProduct(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    ...options,
  });
}

/**
 * Hook para buscar productos
 * 
 * @param params - Parámetros de búsqueda
 * @param options - Opciones de React Query
 * @returns Query con resultados de búsqueda
 * 
 * @example
 * ```typescript
 * const { data: results } = useProductSearch({
 *   query: 'laptop gaming',
 *   limit: 10
 * });
 * ```
 */
export function useProductSearch(
  params: SearchProductsParams,
  options?: Omit<UseQueryOptions<Product[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['products', 'search', params],
    queryFn: () => productService.searchProducts(params),
    enabled: params.query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutos
    ...options,
  });
}

/**
 * Hook para obtener productos destacados
 * 
 * @param limit - Número máximo de productos
 * @param options - Opciones de React Query
 * @returns Query con productos destacados
 * 
 * @example
 * ```typescript
 * const { data: featured } = useFeaturedProducts(10);
 * ```
 */
export function useFeaturedProducts(
  limit: number = 10,
  options?: Omit<UseQueryOptions<Product[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['products', 'featured', limit],
    queryFn: () => productService.getFeaturedProducts(limit),
    staleTime: 10 * 60 * 1000, // 10 minutos
    ...options,
  });
}

/**
 * Hook para obtener productos relacionados
 * 
 * @param productId - ID del producto
 * @param limit - Número máximo de productos
 * @param options - Opciones de React Query
 * @returns Query con productos relacionados
 * 
 * @example
 * ```typescript
 * const { data: related } = useRelatedProducts('prod_123', 4);
 * ```
 */
export function useRelatedProducts(
  productId: string,
  limit: number = 4,
  options?: Omit<UseQueryOptions<Product[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['products', 'related', productId, limit],
    queryFn: () => productService.getRelatedProducts(productId, limit),
    enabled: !!productId,
    staleTime: 10 * 60 * 1000, // 10 minutos
    ...options,
  });
}

/**
 * Hook para obtener productos por categoría
 * 
 * @param categorySlug - Slug de la categoría
 * @param filters - Filtros adicionales
 * @param options - Opciones de React Query
 * @returns Query con productos de la categoría
 * 
 * @example
 * ```typescript
 * const { data } = useProductsByCategory('laptops', {
 *   minPrice: 500,
 *   sortBy: 'price_asc'
 * });
 * ```
 */
export function useProductsByCategory(
  categorySlug: string,
  filters: Partial<Omit<ProductFiltersService, 'category'>> = {},
  options?: Omit<UseQueryOptions<PaginatedResponse<Product>>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['products', 'category', categorySlug, filters],
    queryFn: () => productService.getProductsByCategory(categorySlug, filters),
    enabled: !!categorySlug,
    staleTime: 5 * 60 * 1000, // 5 minutos
    ...options,
  });
}