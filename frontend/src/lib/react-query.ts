/**
 * Configuración de React Query
 * 
 * Define las opciones por defecto para queries y mutations
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query';

const queryConfig: DefaultOptions = {
  queries: {
    // Tiempo que los datos se consideran frescos (no se refetch automáticamente)
    staleTime: 1000 * 60 * 5, // 5 minutos
    
    // Tiempo que los datos se mantienen en caché
    gcTime: 1000 * 60 * 30, // 30 minutos (antes era cacheTime)
    
    // Reintentar peticiones fallidas
    retry: 1,
    
    // Refetch al enfocar la ventana
    refetchOnWindowFocus: false,
    
    // Refetch al reconectar
    refetchOnReconnect: true,
    
    // Refetch al montar el componente
    refetchOnMount: true,
  },
  mutations: {
    // Reintentar mutations fallidas
    retry: 0,
  },
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

// Query keys para organizar el caché
export const queryKeys = {
  // Autenticación
  auth: {
    user: ['auth', 'user'] as const,
    session: ['auth', 'session'] as const,
  },
  
  // Productos
  products: {
    all: ['products'] as const,
    list: (filters?: Record<string, unknown>) => ['products', 'list', filters] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
    search: (query: string) => ['products', 'search', query] as const,
    related: (id: string) => ['products', 'related', id] as const,
  },
  
  // Categorías
  categories: {
    all: ['categories'] as const,
    detail: (id: string) => ['categories', 'detail', id] as const,
  },
  
  // Carrito
  cart: {
    current: ['cart'] as const,
  },
  
  // Pedidos
  orders: {
    all: ['orders'] as const,
    list: (filters?: Record<string, unknown>) => ['orders', 'list', filters] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
    tracking: (id: string) => ['orders', 'tracking', id] as const,
  },
  
  // Usuario
  user: {
    profile: ['user', 'profile'] as const,
    addresses: ['user', 'addresses'] as const,
    paymentMethods: ['user', 'payment-methods'] as const,
    wishlist: ['user', 'wishlist'] as const,
    notifications: ['user', 'notifications'] as const,
  },
  
  // Admin
  admin: {
    dashboard: ['admin', 'dashboard'] as const,
    chatbotMetrics: ['admin', 'chatbot-metrics'] as const,
    recommenderMetrics: ['admin', 'recommender-metrics'] as const,
    automationMetrics: ['admin', 'automation-metrics'] as const,
    tickets: (filters?: Record<string, unknown>) => ['admin', 'tickets', filters] as const,
  },
};
