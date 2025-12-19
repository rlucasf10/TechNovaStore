/**
 * Admin Hooks - Exportaciones
 * 
 * Hooks de React Query para métricas de administración.
 */

export {
  // Hooks individuales
  useChatbotMetrics,
  useRecommenderMetrics,
  useAutomationMetrics,
  useSystemMetrics,
  useBusinessKPIs,
  useRecentActivity,
  useSystemAlerts,
  useServicesHealth,
  useAcknowledgeAlert,
  // Hooks combinados
  useAdminDashboardMetrics,
  useRefreshAdminMetrics,
  // Hooks de analíticas y gráficos
  useSalesData,
  useTopProducts,
  useCategoriesData,
  useConversionFunnel,
  useTrendData,
  // Query keys
  adminQueryKeys,
} from './useAdminMetrics';
