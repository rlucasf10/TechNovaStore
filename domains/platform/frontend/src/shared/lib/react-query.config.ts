/**
 * Configuración Centralizada de React Query
 * 
 * Define configuraciones optimizadas para diferentes tipos de datos:
 * - Datos estáticos (categorías, configuración): staleTime largo
 * - Datos dinámicos (productos, carrito): staleTime medio
 * - Datos en tiempo real (notificaciones): staleTime corto
 * 
 * Implementa:
 * - staleTime y gcTime (antes cacheTime) optimizados
 * - Estrategias de retry inteligentes
 * - Configuración de refetch
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query';

// ============================================================================
// Constantes de Tiempo
// ============================================================================

export const STALE_TIME = {
  // Datos que casi nunca cambian (categorías, configuración)
  STATIC: 1000 * 60 * 30, // 30 minutos
  
  // Datos que cambian ocasionalmente (productos, usuarios)
  MEDIUM: 1000 * 60 * 5, // 5 minutos
  
  // Datos que cambian frecuentemente (carrito, notificaciones)
  DYNAMIC: 1000 * 60 * 1, // 1 minuto
  
  // Datos en tiempo real (chat, tracking)
  REALTIME: 1000 * 30, // 30 segundos
} as const;

export const GC_TIME = {
  // Tiempo que los datos permanecen en caché después de no usarse
  SHORT: 1000 * 60 * 5, // 5 minutos
  MEDIUM: 1000 * 60 * 10, // 10 minutos
  LONG: 1000 * 60 * 30, // 30 minutos
} as const;

// ============================================================================
// Configuración por Defecto
// ============================================================================

export const defaultQueryOptions: DefaultOptions = {
  queries: {
    // Tiempo que los datos se consideran "frescos"
    staleTime: STALE_TIME.MEDIUM,
    
    // Tiempo que los datos permanecen en caché (antes cacheTime)
    gcTime: GC_TIME.MEDIUM,
    
    // Estrategia de retry inteligente
    retry: (failureCount, error: unknown) => {
      // No reintentar en errores 4xx (errores del cliente)
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status && status >= 400 && status < 500) {
        return false;
      }
      
      // Reintentar hasta 3 veces en otros errores
      return failureCount < 3;
    },
    
    // Delay exponencial entre reintentos
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Refetch en eventos específicos
    refetchOnWindowFocus: false, // No refetch al enfocar ventana (evita llamadas innecesarias)
    refetchOnMount: true, // Refetch al montar componente si los datos están stale
    refetchOnReconnect: true, // Refetch al reconectar internet
    
    // Configuración de red
    networkMode: 'online', // Solo hacer queries cuando hay conexión
  },
  
  mutations: {
    // Estrategia de retry para mutaciones
    retry: (failureCount, error: unknown) => {
      // No reintentar en errores 4xx
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status && status >= 400 && status < 500) {
        return false;
      }
      
      // Reintentar hasta 2 veces en otros errores
      return failureCount < 2;
    },
    
    // Delay entre reintentos
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    
    // Configuración de red
    networkMode: 'online',
  },
};

// ============================================================================
// Query Keys Centralizados
// ============================================================================

/**
 * Query keys organizados por dominio
 * Facilita la invalidación y prefetching
 */
export const queryKeys = {
  // Autenticación
  auth: {
    all: ['auth'] as const,
    user: ['auth', 'user'] as const,
    session: ['auth', 'session'] as const,
  },
  
  // Usuario
  user: {
    all: ['user'] as const,
    profile: ['user', 'profile'] as const,
    addresses: ['user', 'addresses'] as const,
    paymentMethods: ['user', 'payment-methods'] as const,
    notifications: ['user', 'notifications'] as const,
    wishlist: ['user', 'wishlist'] as const,
  },
  
  // Productos
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
    search: (query: string) => [...queryKeys.products.all, 'search', query] as const,
    featured: (limit: number) => [...queryKeys.products.all, 'featured', limit] as const,
    related: (id: string, limit: number) => [...queryKeys.products.all, 'related', id, limit] as const,
    category: (slug: string, filters: Record<string, unknown>) => 
      [...queryKeys.products.all, 'category', slug, filters] as const,
  },
  
  // Categorías
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: () => [...queryKeys.categories.lists()] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (slug: string) => [...queryKeys.categories.details(), slug] as const,
  },
  
  // Carrito
  cart: {
    all: ['cart'] as const,
    detail: () => [...queryKeys.cart.all, 'detail'] as const,
  },
  
  // Pedidos
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
    tracking: (id: string) => [...queryKeys.orders.all, 'tracking', id] as const,
  },
  
  // Recomendaciones
  recommendations: {
    all: ['recommendations'] as const,
    user: () => [...queryKeys.recommendations.all, 'user'] as const,
    session: () => [...queryKeys.recommendations.all, 'session'] as const,
    similar: (productId: string) => [...queryKeys.recommendations.all, 'similar', productId] as const,
    trending: () => [...queryKeys.recommendations.all, 'trending'] as const,
  },
  
  // Admin
  admin: {
    all: ['admin'] as const,
    metrics: () => [...queryKeys.admin.all, 'metrics'] as const,
    chatbotMetrics: () => [...queryKeys.admin.metrics(), 'chatbot'] as const,
    recommenderMetrics: () => [...queryKeys.admin.metrics(), 'recommender'] as const,
    automationMetrics: () => [...queryKeys.admin.metrics(), 'automation'] as const,
    systemMetrics: () => [...queryKeys.admin.metrics(), 'system'] as const,
  },
  
  // Tickets
  tickets: {
    all: ['tickets'] as const,
    lists: () => [...queryKeys.tickets.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.tickets.lists(), filters] as const,
    details: () => [...queryKeys.tickets.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tickets.details(), id] as const,
  },
} as const;

// ============================================================================
// Funciones de Utilidad
// ============================================================================

/**
 * Crea una instancia de QueryClient con configuración optimizada
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: defaultQueryOptions,
  });
}

/**
 * Configuración específica para queries de datos estáticos
 */
export function staticQueryOptions() {
  return {
    staleTime: STALE_TIME.STATIC,
    gcTime: GC_TIME.LONG,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  };
}

/**
 * Configuración específica para queries de datos dinámicos
 */
export function dynamicQueryOptions() {
  return {
    staleTime: STALE_TIME.DYNAMIC,
    gcTime: GC_TIME.SHORT,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  };
}

/**
 * Configuración específica para queries de datos en tiempo real
 */
export function realtimeQueryOptions() {
  return {
    staleTime: STALE_TIME.REALTIME,
    gcTime: GC_TIME.SHORT,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: STALE_TIME.REALTIME, // Polling automático
  };
}

// ============================================================================
// Exportar todo
// ============================================================================

export { queryKeys as default };
