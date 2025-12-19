/**
 * usePrefetch Hook
 * 
 * Hook para prefetching de datos antes de que el usuario los necesite
 * Mejora la percepción de velocidad de la aplicación
 * 
 * Estrategias de prefetching:
 * - Hover: Prefetch al pasar el mouse sobre un link
 * - Viewport: Prefetch cuando un elemento entra en el viewport
 * - Predictivo: Prefetch basado en patrones de navegación
 */

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { productService, categoryService } from '@/catalog';
import { queryKeys, STALE_TIME } from '@/lib/react-query.config';
import type { ProductFiltersService } from '@/catalog';

/**
 * Hook principal de prefetching
 */
export function usePrefetch() {
  const queryClient = useQueryClient();

  /**
   * Prefetch de un producto por ID
   * Útil para hover en ProductCard o links de productos
   */
  const prefetchProduct = useCallback(
    async (productId: string) => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.products.detail(productId),
        queryFn: () => productService.getProduct(productId),
        staleTime: STALE_TIME.MEDIUM,
      });
    },
    [queryClient]
  );

  /**
   * Prefetch de productos relacionados
   * Útil para páginas de detalle de producto
   */
  const prefetchRelatedProducts = useCallback(
    async (productId: string, limit: number = 4) => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.products.related(productId, limit),
        queryFn: () => productService.getRelatedProducts(productId, limit),
        staleTime: STALE_TIME.MEDIUM,
      });
    },
    [queryClient]
  );

  /**
   * Prefetch de productos por categoría
   * Útil para hover en menú de categorías
   */
  const prefetchProductsByCategory = useCallback(
    async (categorySlug: string, filters: Partial<ProductFiltersService> = {}) => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.products.category(categorySlug, filters),
        queryFn: () => productService.getProductsByCategory(categorySlug, filters),
        staleTime: STALE_TIME.MEDIUM,
      });
    },
    [queryClient]
  );

  /**
   * Prefetch de una categoría
   * Útil para hover en links de categorías
   */
  const prefetchCategory = useCallback(
    async (categorySlug: string) => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.categories.detail(categorySlug),
        queryFn: () => categoryService.getCategory(categorySlug),
        staleTime: STALE_TIME.STATIC,
      });
    },
    [queryClient]
  );

  /**
   * Prefetch de todas las categorías
   * Útil para cargar en background al inicio
   */
  const prefetchCategories = useCallback(async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.categories.list(),
      queryFn: () => categoryService.getCategories(),
      staleTime: STALE_TIME.STATIC,
    });
  }, [queryClient]);

  /**
   * Prefetch de productos destacados
   * Útil para home page
   */
  const prefetchFeaturedProducts = useCallback(
    async (limit: number = 10) => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.products.featured(limit),
        queryFn: () => productService.getFeaturedProducts(limit),
        staleTime: STALE_TIME.MEDIUM,
      });
    },
    [queryClient]
  );

  return {
    prefetchProduct,
    prefetchRelatedProducts,
    prefetchProductsByCategory,
    prefetchCategory,
    prefetchCategories,
    prefetchFeaturedProducts,
  };
}

/**
 * Hook para prefetch al hacer hover
 * 
 * @param onHover - Función de prefetch a ejecutar
 * @param delay - Delay en ms antes de ejecutar (default: 100ms)
 * @returns Props para agregar al elemento
 * 
 * @example
 * ```typescript
 * const { prefetchProduct } = usePrefetch();
 * const hoverProps = usePrefetchOnHover(() => prefetchProduct('prod_123'));
 * 
 * <Link href="/productos/prod_123" {...hoverProps}>
 *   Ver producto
 * </Link>
 * ```
 */
export function usePrefetchOnHover(
  onHover: () => Promise<void>,
  delay: number = 100
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasPrefetched = useRef(false);

  const handleMouseEnter = useCallback(() => {
    // Solo prefetch una vez
    if (hasPrefetched.current) {
      return;
    }

    // Delay para evitar prefetch en hover accidental
    timeoutRef.current = setTimeout(() => {
      onHover();
      hasPrefetched.current = true;
    }, delay);
  }, [onHover, delay]);

  const handleMouseLeave = useCallback(() => {
    // Cancelar prefetch si el usuario sale antes del delay
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };
}

/**
 * Hook para prefetch cuando un elemento entra en el viewport
 * Usa Intersection Observer
 * 
 * @param onVisible - Función de prefetch a ejecutar
 * @param options - Opciones de Intersection Observer
 * @returns Ref para agregar al elemento
 * 
 * @example
 * ```typescript
 * const { prefetchProduct } = usePrefetch();
 * const ref = usePrefetchOnVisible(() => prefetchProduct('prod_123'));
 * 
 * <div ref={ref}>
 *   <ProductCard product={product} />
 * </div>
 * ```
 */
export function usePrefetchOnVisible(
  onVisible: () => Promise<void>,
  options: IntersectionObserverInit = {}
) {
  const ref = useRef<HTMLElement | null>(null);
  const hasPrefetched = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || hasPrefetched.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasPrefetched.current) {
            onVisible();
            hasPrefetched.current = true;
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Prefetch 50px antes de que sea visible
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [onVisible, options]);

  return ref;
}

/**
 * Hook para prefetch predictivo basado en la ruta actual
 * Prefetch automático de datos relacionados con la página actual
 * 
 * @param pathname - Ruta actual (de usePathname)
 * 
 * @example
 * ```typescript
 * const pathname = usePathname();
 * usePredictivePrefetch(pathname);
 * ```
 */
export function usePredictivePrefetch(pathname: string) {
  const {
    prefetchCategories,
    prefetchFeaturedProducts,
    prefetchRelatedProducts,
  } = usePrefetch();

  useEffect(() => {
    // Home page: prefetch categorías y productos destacados
    if (pathname === '/') {
      prefetchCategories();
      prefetchFeaturedProducts(10);
    }

    // Página de producto: prefetch productos relacionados
    const productMatch = pathname.match(/^\/productos\/([^/]+)$/);
    if (productMatch) {
      const productId = productMatch[1];
      prefetchRelatedProducts(productId, 4);
    }

    // Página de categoría: prefetch categorías para navegación
    if (pathname.startsWith('/categorias/')) {
      prefetchCategories();
    }

    // Catálogo de productos: prefetch categorías
    if (pathname === '/productos') {
      prefetchCategories();
    }
  }, [
    pathname,
    prefetchCategories,
    prefetchFeaturedProducts,
    prefetchRelatedProducts,
  ]);
}

/**
 * Hook para prefetch de siguiente página en paginación
 * 
 * @param currentPage - Página actual
 * @param totalPages - Total de páginas
 * @param fetchPage - Función para fetch de una página específica
 * 
 * @example
 * ```typescript
 * const { data } = useProducts({ page: currentPage });
 * usePrefetchNextPage(
 *   currentPage,
 *   data?.pagination.totalPages || 0,
 *   (page) => productService.getProducts({ page })
 * );
 * ```
 */
export function usePrefetchNextPage<T>(
  currentPage: number,
  totalPages: number,
  fetchPage: (page: number) => Promise<T>
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Solo prefetch si hay siguiente página
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;

      queryClient.prefetchQuery({
        queryKey: ['page', nextPage],
        queryFn: () => fetchPage(nextPage),
        staleTime: STALE_TIME.MEDIUM,
      });
    }
  }, [currentPage, totalPages, fetchPage, queryClient]);
}
