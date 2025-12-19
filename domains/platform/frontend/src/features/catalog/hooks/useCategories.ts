/**
 * useCategories Hook
 * 
 * React Query hooks para gestión de categorías
 * Integración con CategoryService
 * 
 * Optimizaciones implementadas:
 * - staleTime largo para datos estáticos (categorías cambian poco)
 * - Query keys centralizados
 * - gcTime optimizado para caché prolongado
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { categoryService, type CategoryTree } from '@/catalog';
import type { Category } from '@/types';
import { queryKeys, STALE_TIME, GC_TIME, staticQueryOptions } from '@/lib/react-query.config';

/**
 * Hook para obtener todas las categorías
 * 
 * @param options - Opciones de React Query
 * @returns Query con lista de categorías
 * 
 * @example
 * ```typescript
 * const { data: categories, isLoading } = useCategories();
 * ```
 */
export function useCategories(
  options?: Omit<UseQueryOptions<Category[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: () => categoryService.getCategories(),
    ...staticQueryOptions(), // Categorías son datos estáticos
    ...options,
  });
}

/**
 * Hook para obtener una categoría por slug
 * 
 * @param slug - Slug de la categoría
 * @param options - Opciones de React Query
 * @returns Query con la categoría
 * 
 * @example
 * ```typescript
 * const { data: category } = useCategory('laptops');
 * ```
 */
export function useCategory(
  slug: string,
  options?: Omit<UseQueryOptions<Category>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.categories.detail(slug),
    queryFn: () => categoryService.getCategory(slug),
    enabled: !!slug,
    ...staticQueryOptions(), // Categorías son datos estáticos
    ...options,
  });
}

/**
 * Hook para obtener una categoría por ID
 * 
 * @param id - ID de la categoría
 * @param options - Opciones de React Query
 * @returns Query con la categoría
 * 
 * @example
 * ```typescript
 * const { data: category } = useCategoryById('cat_123');
 * ```
 */
export function useCategoryById(
  id: string,
  options?: Omit<UseQueryOptions<Category>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...queryKeys.categories.all, 'id', id],
    queryFn: () => categoryService.getCategoryById(id),
    enabled: !!id,
    ...staticQueryOptions(),
    ...options,
  });
}

/**
 * Hook para obtener árbol de categorías
 * 
 * @param options - Opciones de React Query
 * @returns Query con árbol de categorías
 * 
 * @example
 * ```typescript
 * const { data: tree } = useCategoryTree();
 * ```
 */
export function useCategoryTree(
  options?: Omit<UseQueryOptions<CategoryTree[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...queryKeys.categories.all, 'tree'],
    queryFn: () => categoryService.getCategoryTree(),
    ...staticQueryOptions(),
    ...options,
  });
}

/**
 * Hook para obtener categorías principales
 * 
 * @param options - Opciones de React Query
 * @returns Query con categorías principales
 * 
 * @example
 * ```typescript
 * const { data: rootCategories } = useRootCategories();
 * ```
 */
export function useRootCategories(
  options?: Omit<UseQueryOptions<Category[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...queryKeys.categories.all, 'root'],
    queryFn: () => categoryService.getRootCategories(),
    ...staticQueryOptions(),
    ...options,
  });
}

/**
 * Hook para obtener subcategorías
 * 
 * @param parentId - ID de la categoría padre
 * @param options - Opciones de React Query
 * @returns Query con subcategorías
 * 
 * @example
 * ```typescript
 * const { data: subcategories } = useSubcategories('cat_123');
 * ```
 */
export function useSubcategories(
  parentId: string,
  options?: Omit<UseQueryOptions<Category[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...queryKeys.categories.all, 'subcategories', parentId],
    queryFn: () => categoryService.getSubcategories(parentId),
    enabled: !!parentId,
    ...staticQueryOptions(),
    ...options,
  });
}

/**
 * Hook para obtener categorías destacadas
 * 
 * @param limit - Número máximo de categorías
 * @param options - Opciones de React Query
 * @returns Query con categorías destacadas
 * 
 * @example
 * ```typescript
 * const { data: featured } = useFeaturedCategories(6);
 * ```
 */
export function useFeaturedCategories(
  limit: number = 6,
  options?: Omit<UseQueryOptions<Category[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...queryKeys.categories.all, 'featured', limit],
    queryFn: () => categoryService.getFeaturedCategories(limit),
    ...staticQueryOptions(),
    ...options,
  });
}

/**
 * Hook para buscar categorías
 * 
 * @param query - Término de búsqueda
 * @param options - Opciones de React Query
 * @returns Query con resultados de búsqueda
 * 
 * @example
 * ```typescript
 * const { data: results } = useSearchCategories('laptop');
 * ```
 */
export function useSearchCategories(
  query: string,
  options?: Omit<UseQueryOptions<Category[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...queryKeys.categories.all, 'search', query],
    queryFn: () => categoryService.searchCategories(query),
    enabled: query.length > 2,
    staleTime: STALE_TIME.MEDIUM,
    gcTime: GC_TIME.SHORT,
    ...options,
  });
}