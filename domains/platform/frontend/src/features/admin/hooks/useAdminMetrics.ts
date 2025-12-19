/**
 * Hooks de React Query para Métricas de Administración
 * 
 * Hooks personalizados para obtener métricas del sistema con polling automático.
 * Configurados con polling cada 30 segundos para mantener datos actualizados.
 * 
 * Requisitos: 15.1, 15.2, 15.3, 15.4
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminService,
  type ChatbotMetrics,
  type RecommenderMetrics,
  type AutomationMetrics,
  type SystemMetrics,
  type BusinessKPIs,
  type RecentActivity,
  type SystemAlert,
  type ServiceHealth,
} from '../services/adminService';

// ============================================================================
// Constantes de Configuración
// ============================================================================

/**
 * Intervalo de polling en milisegundos (30 segundos)
 */
const POLLING_INTERVAL = 30 * 1000;

/**
 * Tiempo de caché en milisegundos (25 segundos)
 * Ligeramente menor que el polling para evitar datos obsoletos
 */
const STALE_TIME = 25 * 1000;

/**
 * Claves de query para React Query
 */
export const adminQueryKeys = {
  all: ['admin'] as const,
  metrics: () => [...adminQueryKeys.all, 'metrics'] as const,
  chatbot: () => [...adminQueryKeys.metrics(), 'chatbot'] as const,
  recommender: () => [...adminQueryKeys.metrics(), 'recommender'] as const,
  automation: () => [...adminQueryKeys.metrics(), 'automation'] as const,
  system: () => [...adminQueryKeys.metrics(), 'system'] as const,
  kpis: () => [...adminQueryKeys.all, 'kpis'] as const,
  activity: (limit?: number) => [...adminQueryKeys.all, 'activity', limit] as const,
  alerts: () => [...adminQueryKeys.all, 'alerts'] as const,
  servicesHealth: () => [...adminQueryKeys.all, 'services-health'] as const,
};

// ============================================================================
// Hooks de Métricas
// ============================================================================

/**
 * Hook para obtener métricas del Chatbot (AI)
 * 
 * @param options - Opciones adicionales
 * @returns Query result con métricas del chatbot
 * 
 * @example
 * ```tsx
 * const { data: chatbotMetrics, isLoading } = useChatbotMetrics();
 * ```
 * 
 * Requisitos: 15.2
 */
export function useChatbotMetrics(options?: { enabled?: boolean }) {
  return useQuery<ChatbotMetrics, Error>({
    queryKey: adminQueryKeys.chatbot(),
    queryFn: () => adminService.getChatbotMetrics(),
    staleTime: STALE_TIME,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 2,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook para obtener métricas del Recommender
 * 
 * @param options - Opciones adicionales
 * @returns Query result con métricas del recommender
 * 
 * @example
 * ```tsx
 * const { data: recommenderMetrics, isLoading } = useRecommenderMetrics();
 * ```
 * 
 * Requisitos: 15.2
 */
export function useRecommenderMetrics(options?: { enabled?: boolean }) {
  return useQuery<RecommenderMetrics, Error>({
    queryKey: adminQueryKeys.recommender(),
    queryFn: () => adminService.getRecommenderMetrics(),
    staleTime: STALE_TIME,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 2,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook para obtener métricas de Automatización
 * 
 * @param options - Opciones adicionales
 * @returns Query result con métricas de automatización
 * 
 * @example
 * ```tsx
 * const { data: automationMetrics, isLoading } = useAutomationMetrics();
 * ```
 * 
 * Requisitos: 15.3
 */
export function useAutomationMetrics(options?: { enabled?: boolean }) {
  return useQuery<AutomationMetrics, Error>({
    queryKey: adminQueryKeys.automation(),
    queryFn: () => adminService.getAutomationMetrics(),
    staleTime: STALE_TIME,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 2,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook para obtener métricas del Sistema
 * 
 * @param options - Opciones adicionales
 * @returns Query result con métricas del sistema
 * 
 * @example
 * ```tsx
 * const { data: systemMetrics, isLoading } = useSystemMetrics();
 * ```
 * 
 * Requisitos: 15.4
 */
export function useSystemMetrics(options?: { enabled?: boolean }) {
  return useQuery<SystemMetrics, Error>({
    queryKey: adminQueryKeys.system(),
    queryFn: () => adminService.getSystemMetrics(),
    staleTime: STALE_TIME,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 2,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook para obtener KPIs de negocio
 * 
 * @param options - Opciones adicionales
 * @returns Query result con KPIs de negocio
 * 
 * @example
 * ```tsx
 * const { data: kpis, isLoading } = useBusinessKPIs();
 * ```
 * 
 * Requisitos: 15.1
 */
export function useBusinessKPIs(options?: { enabled?: boolean }) {
  return useQuery<BusinessKPIs, Error>({
    queryKey: adminQueryKeys.kpis(),
    queryFn: () => adminService.getBusinessKPIs(),
    staleTime: STALE_TIME,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 2,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook para obtener actividad reciente
 * 
 * @param limit - Número máximo de actividades
 * @param options - Opciones adicionales
 * @returns Query result con actividades recientes
 * 
 * @example
 * ```tsx
 * const { data: activities, isLoading } = useRecentActivity(10);
 * ```
 */
export function useRecentActivity(limit: number = 10, options?: { enabled?: boolean }) {
  return useQuery<RecentActivity[], Error>({
    queryKey: adminQueryKeys.activity(limit),
    queryFn: () => adminService.getRecentActivity(limit),
    staleTime: STALE_TIME,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 2,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook para obtener alertas del sistema
 * 
 * @param options - Opciones adicionales
 * @returns Query result con alertas del sistema
 * 
 * @example
 * ```tsx
 * const { data: alerts, isLoading } = useSystemAlerts();
 * ```
 */
export function useSystemAlerts(options?: { enabled?: boolean }) {
  return useQuery<SystemAlert[], Error>({
    queryKey: adminQueryKeys.alerts(),
    queryFn: () => adminService.getSystemAlerts(),
    staleTime: STALE_TIME,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 2,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook para obtener estado de salud de todos los servicios
 * 
 * @param options - Opciones adicionales
 * @returns Query result con estado de salud de servicios
 * 
 * @example
 * ```tsx
 * const { data: servicesHealth, isLoading } = useServicesHealth();
 * ```
 */
export function useServicesHealth(options?: { enabled?: boolean }) {
  return useQuery<ServiceHealth[], Error>({
    queryKey: adminQueryKeys.servicesHealth(),
    queryFn: () => adminService.getAllServicesHealth(),
    staleTime: STALE_TIME,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 2,
    enabled: options?.enabled ?? true,
  });
}

// ============================================================================
// Hooks de Mutación
// ============================================================================

/**
 * Hook para reconocer una alerta
 * 
 * @returns Mutation para reconocer alertas
 * 
 * @example
 * ```tsx
 * const { mutate: acknowledgeAlert } = useAcknowledgeAlert();
 * acknowledgeAlert('alert-123');
 * ```
 */
export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => adminService.acknowledgeAlert(alertId),
    onSuccess: () => {
      // Invalidar la query de alertas para refrescar
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.alerts() });
    },
  });
}

// ============================================================================
// Hooks Combinados
// ============================================================================

/**
 * Hook para obtener todas las métricas del dashboard de admin
 * 
 * Combina todas las métricas en un solo hook para facilitar el uso.
 * 
 * @param options - Opciones adicionales
 * @returns Objeto con todas las métricas y estados de carga
 * 
 * @example
 * ```tsx
 * const {
 *   chatbot,
 *   recommender,
 *   automation,
 *   system,
 *   kpis,
 *   isLoading,
 *   refetchAll
 * } = useAdminDashboardMetrics();
 * ```
 */
export function useAdminDashboardMetrics(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();
  const enabled = options?.enabled ?? true;

  const chatbot = useChatbotMetrics({ enabled });
  const recommender = useRecommenderMetrics({ enabled });
  const automation = useAutomationMetrics({ enabled });
  const system = useSystemMetrics({ enabled });
  const kpis = useBusinessKPIs({ enabled });
  const servicesHealth = useServicesHealth({ enabled });

  const isLoading = 
    chatbot.isLoading ||
    recommender.isLoading ||
    automation.isLoading ||
    system.isLoading ||
    kpis.isLoading ||
    servicesHealth.isLoading;

  const isError =
    chatbot.isError ||
    recommender.isError ||
    automation.isError ||
    system.isError ||
    kpis.isError ||
    servicesHealth.isError;

  const refetchAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.chatbot() }),
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.recommender() }),
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.automation() }),
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.system() }),
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.kpis() }),
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.servicesHealth() }),
    ]);
  };

  return {
    chatbot: chatbot.data,
    recommender: recommender.data,
    automation: automation.data,
    system: system.data,
    kpis: kpis.data,
    servicesHealth: servicesHealth.data,
    isLoading,
    isError,
    refetchAll,
    // Estados individuales para control más granular
    queries: {
      chatbot,
      recommender,
      automation,
      system,
      kpis,
      servicesHealth,
    },
  };
}

/**
 * Hook para refrescar manualmente todas las métricas
 * 
 * @returns Función para refrescar todas las métricas
 * 
 * @example
 * ```tsx
 * const refreshMetrics = useRefreshAdminMetrics();
 * <button onClick={refreshMetrics}>Actualizar</button>
 * ```
 */
export function useRefreshAdminMetrics() {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: adminQueryKeys.all });
  };
}

// ============================================================================
// Hooks de Analíticas y Gráficos
// ============================================================================

/**
 * Hook para obtener datos de ventas por día
 * 
 * @param days - Número de días a obtener
 * @param options - Opciones adicionales
 * @returns Query result con datos de ventas
 * 
 * @example
 * ```tsx
 * const { data: salesData, isLoading } = useSalesData(30);
 * ```
 * 
 * Requisitos: 15.1
 */
export function useSalesData(days: number = 30, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...adminQueryKeys.all, 'sales-data', days] as const,
    queryFn: () => adminService.getSalesData(days),
    staleTime: STALE_TIME,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 2,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook para obtener productos más vendidos
 * 
 * @param limit - Número de productos a obtener
 * @param options - Opciones adicionales
 * @returns Query result con productos más vendidos
 * 
 * @example
 * ```tsx
 * const { data: topProducts, isLoading } = useTopProducts(10);
 * ```
 * 
 * Requisitos: 15.1
 */
export function useTopProducts(limit: number = 10, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...adminQueryKeys.all, 'top-products', limit] as const,
    queryFn: () => adminService.getTopProducts(limit),
    staleTime: STALE_TIME,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 2,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook para obtener datos de categorías
 * 
 * @param options - Opciones adicionales
 * @returns Query result con datos de categorías
 * 
 * @example
 * ```tsx
 * const { data: categoriesData, isLoading } = useCategoriesData();
 * ```
 * 
 * Requisitos: 15.1
 */
export function useCategoriesData(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...adminQueryKeys.all, 'categories-data'] as const,
    queryFn: () => adminService.getCategoriesData(),
    staleTime: STALE_TIME,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 2,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook para obtener datos del embudo de conversión
 * 
 * @param options - Opciones adicionales
 * @returns Query result con datos del embudo
 * 
 * @example
 * ```tsx
 * const { data: funnelData, isLoading } = useConversionFunnel();
 * ```
 * 
 * Requisitos: 15.1
 */
export function useConversionFunnel(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...adminQueryKeys.all, 'conversion-funnel'] as const,
    queryFn: () => adminService.getConversionFunnel(),
    staleTime: STALE_TIME,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 2,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook para obtener datos de tendencia para KPIs
 * 
 * @param options - Opciones adicionales
 * @returns Query result con datos de tendencia
 * 
 * @example
 * ```tsx
 * const { data: trendData, isLoading } = useTrendData();
 * ```
 * 
 * Requisitos: 15.1
 */
export function useTrendData(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...adminQueryKeys.all, 'trend-data'] as const,
    queryFn: () => adminService.getTrendData(),
    staleTime: STALE_TIME,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: false,
    retry: 2,
    enabled: options?.enabled ?? true,
  });
}
