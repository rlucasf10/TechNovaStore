/**
 * useInfiniteProducts Hook
 * 
 * Hook para paginación infinita de productos usando React Query Infinite Queries
 * Optimizado para scroll infinito y "Load More" buttons
 * 
 * Características:
 * - Paginación automática
 * - Caché inteligente de páginas
 * - Prefetching de siguiente página
 * - Optimización de rendimiento
 */

import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query';
import { productService, type ProductFiltersService } from '@/catalog';
import type { Product } from '@/types';
import { queryKeys, STALE_TIME, GC_TIME } from '@/lib/react-query.config';

/**
 * Tipo de respuesta para infinite query
 */
interface InfiniteProductsPage {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    nextPage: number | null;
    previousPage: number | null;
  };
}

/**
 * Hook para paginación infinita de productos
 * 
 * @param filters - Filtros de búsqueda
 * @param options - Opciones de React Query
 * @returns Infinite query con productos paginados
 * 
 * @example
 * ```typescript
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 *   isLoading
 * } = useInfiniteProducts({
 *   category: 'laptops',
 *   sortBy: 'price_asc',
 *   limit: 20
 * });
 * 
 * // Renderizar productos
 * {data?.pages.map((page) => (
 *   page.products.map((product) => (
 *     <ProductCard key={product.id} product={product} />
 *   ))
 * ))}
 * 
 * // Botón "Cargar más"
 * {hasNextPage && (
 *   <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
 *     {isFetchingNextPage ? 'Cargando...' : 'Cargar más'}
 *   </button>
 * )}
 * ```
 */
export function useInfiniteProducts(
  filters: Partial<ProductFiltersService> = {},
  options?: Partial<UseInfiniteQueryOptions<InfiniteProductsPage, Error>>
) {
  const limit = filters.limit || 20;

  return useInfiniteQuery<InfiniteProductsPage, Error>({
    queryKey: [...queryKeys.products.list(filters), 'infinite'],
    
    queryFn: async ({ pageParam = 1 }) => {
      const response = await productService.getProducts({
        ...filters,
        page: pageParam as number,
        limit,
      });

      // Transformar respuesta a formato de infinite query
      const totalPages = response.pagination.pages || Math.ceil(response.pagination.total / response.pagination.limit);
      
      return {
        products: response.data,
        pagination: {
          page: response.pagination.page,
          limit: response.pagination.limit,
          total: response.pagination.total,
          totalPages,
          hasMore: response.pagination.page < totalPages,
          nextPage: response.pagination.page < totalPages 
            ? response.pagination.page + 1 
            : null,
          previousPage: response.pagination.page > 1 
            ? response.pagination.page - 1 
            : null,
        },
      };
    },
    
    // Configuración de paginación
    initialPageParam: 1,
    
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.nextPage;
    },
    
    getPreviousPageParam: (firstPage) => {
      return firstPage.pagination.previousPage;
    },
    
    // Aplicar configuración optimizada
    staleTime: options?.staleTime ?? STALE_TIME.MEDIUM,
    gcTime: options?.gcTime ?? GC_TIME.MEDIUM,
    refetchOnMount: options?.refetchOnMount ?? false,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    enabled: options?.enabled,
  });
}

/**
 * Hook auxiliar para obtener todos los productos de todas las páginas
 * 
 * @param infiniteQuery - Resultado de useInfiniteProducts
 * @returns Array plano de todos los productos
 * 
 * @example
 * ```typescript
 * const infiniteQuery = useInfiniteProducts({ category: 'laptops' });
 * const allProducts = useAllProducts(infiniteQuery);
 * ```
 */
export function useAllProducts(infiniteQuery: { data?: { pages: InfiniteProductsPage[] } }): Product[] {
  if (!infiniteQuery.data) {
    return [];
  }

  return infiniteQuery.data.pages.flatMap((page) => page.products);
}

/**
 * Hook auxiliar para obtener el total de productos
 * 
 * @param infiniteQuery - Resultado de useInfiniteProducts
 * @returns Total de productos disponibles
 */
export function useTotalProducts(infiniteQuery: { data?: { pages: InfiniteProductsPage[] } }): number {
  if (!infiniteQuery.data || infiniteQuery.data.pages.length === 0) {
    return 0;
  }

  return infiniteQuery.data.pages[0].pagination.total;
}

/**
 * Hook para paginación infinita de productos por categoría
 * 
 * @param categorySlug - Slug de la categoría
 * @param filters - Filtros adicionales
 * @param options - Opciones de React Query
 * @returns Infinite query con productos de la categoría
 * 
 * @example
 * ```typescript
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage
 * } = useInfiniteProductsByCategory('laptops', {
 *   minPrice: 500,
 *   sortBy: 'price_asc'
 * });
 * ```
 */
export function useInfiniteProductsByCategory(
  categorySlug: string,
  filters: Partial<Omit<ProductFiltersService, 'category'>> = {},
  options?: Partial<UseInfiniteQueryOptions<InfiniteProductsPage, Error>>
) {
  return useInfiniteProducts(
    {
      ...filters,
      category: categorySlug,
    },
    {
      enabled: !!categorySlug && (options?.enabled !== false),
      staleTime: options?.staleTime,
      gcTime: options?.gcTime,
      refetchOnMount: options?.refetchOnMount,
      refetchOnWindowFocus: options?.refetchOnWindowFocus,
    }
  );
}

/**
 * Hook para paginación infinita de resultados de búsqueda
 * 
 * @param query - Término de búsqueda
 * @param filters - Filtros adicionales
 * @param options - Opciones de React Query
 * @returns Infinite query con resultados de búsqueda
 * 
 * @example
 * ```typescript
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage
 * } = useInfiniteProductSearch('laptop gaming', {
 *   minPrice: 1000
 * });
 * ```
 */
export function useInfiniteProductSearch(
  query: string,
  filters: Partial<Omit<ProductFiltersService, 'search'>> = {},
  options?: Partial<UseInfiniteQueryOptions<InfiniteProductsPage, Error>>
) {
  return useInfiniteProducts(
    {
      ...filters,
      search: query,
    },
    {
      enabled: query.length > 2 && (options?.enabled !== false),
      staleTime: options?.staleTime,
      gcTime: options?.gcTime,
      refetchOnMount: options?.refetchOnMount,
      refetchOnWindowFocus: options?.refetchOnWindowFocus,
    }
  );
}
