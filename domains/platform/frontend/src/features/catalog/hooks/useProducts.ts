/**
 * useProducts Hook
 * 
 * React Query hooks para gestión de productos
 * Integración con ProductService
 * 
 * Optimizaciones implementadas:
 * - staleTime y gcTime configurados según tipo de dato
 * - Query keys centralizados
 * - Prefetching automático de datos relacionados
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { productService, type ProductFiltersService, type SearchProductsParams } from '@/catalog';
import type { Product, PaginatedResponse } from '@/types';
import { queryKeys, STALE_TIME, GC_TIME } from '@/lib/react-query.config';

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
    queryKey: queryKeys.products.list(filters),
    queryFn: () => productService.getProducts(filters),
    staleTime: STALE_TIME.MEDIUM,
    gcTime: GC_TIME.MEDIUM,
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
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productService.getProduct(id),
    enabled: !!id,
    staleTime: STALE_TIME.MEDIUM,
    gcTime: GC_TIME.MEDIUM,
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
    queryKey: queryKeys.products.search(params.query),
    queryFn: () => productService.searchProducts(params),
    enabled: params.query.length > 2,
    staleTime: STALE_TIME.DYNAMIC, // Búsquedas son más dinámicas
    gcTime: GC_TIME.SHORT,
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
    queryKey: queryKeys.products.featured(limit),
    queryFn: () => productService.getFeaturedProducts(limit),
    staleTime: STALE_TIME.MEDIUM,
    gcTime: GC_TIME.LONG, // Productos destacados cambian poco
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
    queryKey: queryKeys.products.related(productId, limit),
    queryFn: () => productService.getRelatedProducts(productId, limit),
    enabled: !!productId,
    staleTime: STALE_TIME.MEDIUM,
    gcTime: GC_TIME.LONG, // Productos relacionados cambian poco
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
    queryKey: queryKeys.products.category(categorySlug, filters),
    queryFn: () => productService.getProductsByCategory(categorySlug, filters),
    enabled: !!categorySlug,
    staleTime: STALE_TIME.MEDIUM,
    gcTime: GC_TIME.MEDIUM,
    ...options,
  });
}