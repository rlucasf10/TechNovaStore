/**
 * Página principal del Dashboard de Administración
 * 
 * Muestra KPIs y métricas generales del sistema con datos en tiempo real.
 * Protegida por AdminRoute a través del layout.
 * Usa polling cada 30 segundos para mantener datos actualizados.
 * 
 * Requisitos: 15.1, 15.2, 15.3, 15.4
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  useAdminDashboardMetrics,
  useRecentActivity,
  useSalesData,
  useTopProducts,
  useCategoriesData,
  useConversionFunnel,
  useTrendData,
  type ServiceHealth,
  type ServiceHealthStatus,
} from '@/features/admin';

// Dynamic imports para gráficos pesados (recharts)
// Esto reduce el bundle inicial significativamente
const MiniTrendChart = dynamic(
  () => import('@/components/admin/charts').then(mod => ({ default: mod.MiniTrendChart })),
  { ssr: false, loading: () => <div className="h-10 bg-gray-100 animate-pulse rounded" /> }
);
const SalesChart = dynamic(
  () => import('@/components/admin/charts').then(mod => ({ default: mod.SalesChart })),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded" /> }
);
const TopProductsChart = dynamic(
  () => import('@/components/admin/charts').then(mod => ({ default: mod.TopProductsChart })),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded" /> }
);
const CategoriesChart = dynamic(
  () => import('@/components/admin/charts').then(mod => ({ default: mod.CategoriesChart })),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded" /> }
);
const ConversionFunnelChart = dynamic(
  () => import('@/components/admin/charts').then(mod => ({ default: mod.ConversionFunnelChart })),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded" /> }
);

// ============================================================================
// Tipos
// ============================================================================

interface KPICard {
  name: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
  trendData?: number[];
}

interface RecentActivityItem {
  id: string;
  type: 'order' | 'ticket' | 'user' | 'product' | 'system';
  message: string;
  time: string;
  priority?: 'high' | 'medium' | 'low';
}

// ============================================================================
// Componentes auxiliares
// ============================================================================

function KPICardComponent({ kpi, isLoading }: { kpi: KPICard; isLoading?: boolean }) {
  const trendIcon = kpi.trend === 'up' ? '↗' : kpi.trend === 'down' ? '↘' : '→';
  const trendColor = kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600';

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-lg" />
          <div className="w-16 h-4 bg-gray-200 rounded" />
        </div>
        <div className="w-24 h-4 bg-gray-200 rounded mb-2" />
        <div className="w-20 h-8 bg-gray-200 rounded mb-3" />
        <div className="w-full h-10 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${kpi.color} rounded-lg flex items-center justify-center text-2xl`}>
          {kpi.icon}
        </div>
        <div className={`flex items-center ${trendColor}`}>
          <span className="text-lg mr-1">{trendIcon}</span>
          <span className="text-sm font-semibold">{kpi.change}</span>
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{kpi.name}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-3">{kpi.value}</p>
      {kpi.trendData && kpi.trendData.length > 0 && (
        <div className="mt-2">
          <MiniTrendChart data={kpi.trendData} trend={kpi.trend} />
        </div>
      )}
    </div>
  );
}

function ServiceStatusCard({ service, isLoading }: { service: ServiceHealth; isLoading?: boolean }) {
  const statusConfig: Record<ServiceHealthStatus, { color: string; text: string; textColor: string }> = {
    healthy: { color: 'bg-green-500', text: 'Operativo', textColor: 'text-green-600' },
    warning: { color: 'bg-yellow-500', text: 'Advertencia', textColor: 'text-yellow-600' },
    error: { color: 'bg-red-500', text: 'Error', textColor: 'text-red-600' },
    unknown: { color: 'bg-gray-400', text: 'Desconocido', textColor: 'text-gray-500' },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 bg-gray-200 rounded-full" />
          <div className="w-32 h-4 bg-gray-200 rounded" />
        </div>
        <div className="w-20 h-4 bg-gray-200 rounded" />
      </div>
    );
  }

  const config = statusConfig[service.status];

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center space-x-3">
        <div className={`w-2.5 h-2.5 ${config.color} rounded-full`} />
        <span className="text-sm font-medium text-gray-700">{service.name}</span>
      </div>
      <div className="flex items-center space-x-4 text-sm">
        {service.latency !== undefined && (
          <span className="text-gray-500">
            🕐 {service.latency}ms
          </span>
        )}
        <span className={`font-medium ${config.textColor}`}>
          {config.text}
        </span>
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: RecentActivityItem }) {
  const typeConfig = {
    order: { icon: '🛒', color: 'bg-blue-100 text-blue-600' },
    ticket: { icon: '💬', color: 'bg-orange-100 text-orange-600' },
    user: { icon: '👤', color: 'bg-purple-100 text-purple-600' },
    product: { icon: '📦', color: 'bg-green-100 text-green-600' },
    system: { icon: '⚡', color: 'bg-gray-100 text-gray-600' },
  };

  const config = typeConfig[activity.type];

  return (
    <div className="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-0">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700">{activity.message}</p>
        <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
      </div>
      {activity.priority === 'high' && (
        <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
          Urgente
        </span>
      )}
    </div>
  );
}

function ChatbotStatusCard({ 
  status, 
  usingFallback, 
  ollamaAvailable,
  geminiAvailable,
  isLoading 
}: { 
  status: ServiceHealthStatus;
  usingFallback: boolean;
  ollamaAvailable: boolean;
  geminiAvailable: boolean;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="w-32 h-5 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="w-full h-4 bg-gray-200 rounded" />
          <div className="w-3/4 h-4 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const statusColors: Record<ServiceHealthStatus, string> = {
    healthy: 'bg-green-100 border-green-200',
    warning: 'bg-yellow-100 border-yellow-200',
    error: 'bg-red-100 border-red-200',
    unknown: 'bg-gray-100 border-gray-200',
  };

  return (
    <div className={`rounded-xl border p-6 ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          🤖 Estado del Chatbot IA
        </h3>
        {usingFallback && (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-200 text-yellow-800 rounded-full">
            Modo Básico
          </span>
        )}
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Ollama (Phi-3):</span>
          <span className={ollamaAvailable ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
            {ollamaAvailable ? '✓ Disponible' : '✗ No disponible'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Gemini (2.5-flash):</span>
          <span className={geminiAvailable ? 'text-green-600 font-medium' : 'text-gray-500 font-medium'}>
            {geminiAvailable ? '✓ Conectado' : '○ No configurado'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Modo Básico (Fallback):</span>
          <span className="text-green-600 font-medium">✓ Disponible</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Estado general:</span>
          <span className={`font-medium ${
            status === 'healthy' ? 'text-green-600' : 
            status === 'warning' ? 'text-yellow-600' : 
            status === 'error' ? 'text-red-600' : 'text-gray-500'
          }`}>
            {status === 'healthy' ? 'Operativo' : 
             status === 'warning' ? 'Degradado' : 
             status === 'error' ? 'Error' : 'Desconocido'}
          </span>
        </div>
      </div>
    </div>
  );
}

function AutomationStatusCard({
  autoPurchase,
  syncEngine,
  isLoading,
}: {
  autoPurchase: { status: ServiceHealthStatus; pendingOrders: number; successRate: number };
  syncEngine: { status: ServiceHealthStatus; lastSyncAt?: string; syncErrors: number };
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="w-40 h-5 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="w-full h-4 bg-gray-200 rounded" />
          <div className="w-3/4 h-4 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const hasWarning = autoPurchase.status !== 'healthy' || syncEngine.status !== 'healthy';

  return (
    <div className={`rounded-xl border p-6 ${hasWarning ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100'}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        ⚙️ Automatización
      </h3>
      <div className="space-y-4">
        {/* Auto Purchase */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Compra Automática</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              autoPurchase.status === 'healthy' ? 'bg-green-100 text-green-700' :
              autoPurchase.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {autoPurchase.status === 'healthy' ? 'OK' : autoPurchase.status === 'warning' ? 'Lento' : 'Error'}
            </span>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Pedidos pendientes:</span>
              <span className="font-medium">{autoPurchase.pendingOrders}</span>
            </div>
            <div className="flex justify-between">
              <span>Tasa de éxito:</span>
              <span className="font-medium">{autoPurchase.successRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Sync Engine */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Motor de Sincronización</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              syncEngine.status === 'healthy' ? 'bg-green-100 text-green-700' :
              syncEngine.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {syncEngine.status === 'healthy' ? 'OK' : syncEngine.status === 'warning' ? 'Advertencia' : 'Error'}
            </span>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Última sincronización:</span>
              <span className="font-medium">
                {syncEngine.lastSyncAt ? formatTimeAgo(syncEngine.lastSyncAt) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Errores de sync:</span>
              <span className={`font-medium ${syncEngine.syncErrors > 0 ? 'text-red-600' : ''}`}>
                {syncEngine.syncErrors}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Utilidades
// ============================================================================

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

function formatPercentChange(current: number, previous: number): { value: string; trend: 'up' | 'down' | 'neutral' } {
  if (previous === 0) return { value: '+0%', trend: 'neutral' };
  const change = ((current - previous) / previous) * 100;
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
  const sign = change > 0 ? '+' : '';
  return { value: `${sign}${change.toFixed(1)}%`, trend };
}

// ============================================================================
// Datos de ejemplo para actividad (mientras no hay endpoint)
// ============================================================================

const FALLBACK_ACTIVITIES: RecentActivityItem[] = [
  { id: '1', type: 'order', message: 'Nuevo pedido #1234 - €459.99', time: 'Hace 5 min', priority: 'high' },
  { id: '2', type: 'ticket', message: 'Ticket #567 marcado como urgente', time: 'Hace 15 min', priority: 'high' },
  { id: '3', type: 'user', message: 'Nuevo usuario registrado: maria@example.com', time: 'Hace 30 min' },
  { id: '4', type: 'product', message: 'Stock bajo: "Laptop Dell XPS 15" (3 unidades)', time: 'Hace 1 hora', priority: 'medium' },
  { id: '5', type: 'system', message: 'Sincronización de precios completada', time: 'Hace 2 horas' },
  { id: '6', type: 'order', message: 'Pedido #1230 enviado correctamente', time: 'Hace 3 horas' },
];

// ============================================================================
// Componente Principal
// ============================================================================

export default function AdminDashboardPage() {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Obtener métricas con polling automático cada 30 segundos
  const {
    chatbot,
    automation,
    kpis,
    servicesHealth,
    isLoading,
    refetchAll,
  } = useAdminDashboardMetrics();

  // Obtener actividad reciente
  const { data: recentActivity } = useRecentActivity(6);

  // Obtener datos de analíticas y gráficos
  const { data: salesData, isLoading: isLoadingSales } = useSalesData(30);
  const { data: topProducts, isLoading: isLoadingProducts } = useTopProducts(10);
  const { data: categoriesData, isLoading: isLoadingCategories } = useCategoriesData();
  const { data: funnelData, isLoading: isLoadingFunnel } = useConversionFunnel();
  const { data: trendData } = useTrendData();

  const handleRefresh = async () => {
    await refetchAll();
    setLastUpdate(new Date());
  };

  // Actualizar timestamp cuando cambian los datos
  useEffect(() => {
    if (!isLoading) {
      setLastUpdate(new Date());
    }
  }, [isLoading, chatbot, automation, kpis]);

  // Construir KPIs desde los datos reales con tendencias
  const kpiCards: KPICard[] = [
    {
      name: 'Ventas del Día',
      value: kpis ? formatCurrency(kpis.sales.today) : '€0',
      change: kpis ? formatPercentChange(kpis.sales.today, kpis.sales.yesterday).value : '+0%',
      trend: kpis ? formatPercentChange(kpis.sales.today, kpis.sales.yesterday).trend : 'neutral',
      icon: '💰',
      color: 'bg-green-500',
      trendData: trendData?.sales,
    },
    {
      name: 'Pedidos Activos',
      value: kpis ? (kpis.orders.pending + kpis.orders.processing).toString() : '0',
      change: '+0%',
      trend: 'neutral',
      icon: '🛒',
      color: 'bg-blue-500',
      trendData: trendData?.orders,
    },
    {
      name: 'Tickets Abiertos',
      value: kpis ? kpis.tickets.open.toString() : '0',
      change: '-0%',
      trend: 'neutral',
      icon: '💬',
      color: 'bg-orange-500',
      trendData: trendData?.tickets,
    },
    {
      name: 'Usuarios Activos',
      value: kpis ? kpis.users.activeToday.toLocaleString('es-ES') : '0',
      change: '+0%',
      trend: 'neutral',
      icon: '👥',
      color: 'bg-purple-500',
      trendData: trendData?.users,
    },
  ];

  // Filtrar servicios principales para mostrar
  const mainServices: ServiceHealth[] = servicesHealth?.slice(0, 5) || [
    { name: 'AI Chatbot (Ollama)', status: 'unknown' },
    { name: 'Product Sync Engine', status: 'unknown' },
    { name: 'Auto Purchase System', status: 'unknown' },
    { name: 'Payment Service', status: 'unknown' },
    { name: 'Notification Service', status: 'unknown' },
  ];

  // Actividades a mostrar
  const activities: RecentActivityItem[] = recentActivity?.map(a => ({
    id: a.id,
    type: a.type,
    message: a.message,
    time: formatTimeAgo(a.timestamp),
    priority: a.priority,
  })) || FALLBACK_ACTIVITIES;

  // Detectar si hay alertas de automatización
  const hasAutomationWarning = 
    automation?.autoPurchase.status !== 'healthy' || 
    automation?.syncEngine.status !== 'healthy';

  return (
    <div className="space-y-6">
      {/* Header con título y acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Resumen General
          </h2>
          <p className="text-gray-500 mt-1">
            Última actualización: {formatTimeAgo(lastUpdate.toISOString())}
            {isLoading && <span className="ml-2 text-blue-500">Actualizando...</span>}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <span className={`mr-2 ${isLoading ? 'animate-spin' : ''}`}>🔄</span>
          Actualizar
        </button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {kpiCards.map((kpi) => (
          <KPICardComponent key={kpi.name} kpi={kpi} isLoading={isLoading} />
        ))}
      </div>

      {/* Contenido principal en dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Actividad reciente (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Estado del Chatbot IA */}
          <ChatbotStatusCard
            status={chatbot?.status || 'unknown'}
            usingFallback={chatbot?.usingFallback || false}
            ollamaAvailable={chatbot?.ollamaAvailable || false}
            geminiAvailable={chatbot?.geminiAvailable || false}
            isLoading={isLoading}
          />

          {/* Actividad Reciente */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Actividad Reciente
              </h3>
              <Link
                href="/dashboard/admin/activity"
                className="text-sm text-purple-600 hover:text-purple-700 font-medium inline-flex items-center"
              >
                Ver todo →
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>

          {/* Gráfico de Ventas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📈 Ventas (Últimos 30 días)
            </h3>
            <SalesChart data={salesData || []} isLoading={isLoadingSales} />
          </div>

          {/* Gráficos de Productos y Categorías */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📦 Productos Más Vendidos (Top 10)
              </h3>
              <TopProductsChart data={topProducts || []} isLoading={isLoadingProducts} />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📊 Categorías Más Populares
              </h3>
              <CategoriesChart data={categoriesData || []} isLoading={isLoadingCategories} />
            </div>
          </div>

          {/* Embudo de Conversión */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🎯 Embudo de Conversión
            </h3>
            <ConversionFunnelChart data={funnelData || []} isLoading={isLoadingFunnel} />
          </div>
        </div>

        {/* Columna derecha: Estado de servicios (1/3) */}
        <div className="space-y-6">
          {/* Estado de Automatización */}
          <AutomationStatusCard
            autoPurchase={{
              status: automation?.autoPurchase.status || 'unknown',
              pendingOrders: automation?.autoPurchase.pendingOrders || 0,
              successRate: automation?.autoPurchase.successRate || 0,
            }}
            syncEngine={{
              status: automation?.syncEngine.status || 'unknown',
              lastSyncAt: automation?.syncEngine.lastSyncAt,
              syncErrors: automation?.syncEngine.syncErrors || 0,
            }}
            isLoading={isLoading}
          />

          {/* Estado de Servicios */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Estado de Servicios
              </h3>
              <Link
                href="/dashboard/admin/ai-services"
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Detalles
              </Link>
            </div>
            <div>
              {mainServices.map((service) => (
                <ServiceStatusCard key={service.name} service={service} isLoading={isLoading} />
              ))}
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Acciones Rápidas
            </h3>
            <div className="space-y-2">
              <Link
                href="/dashboard/admin/products/new"
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="mr-3">📦</span>
                Agregar Producto
              </Link>
              <Link
                href="/dashboard/admin/campaigns/new"
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="mr-3">⚡</span>
                Nueva Campaña
              </Link>
              <Link
                href="/dashboard/admin/tickets"
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="mr-3">💬</span>
                Ver Tickets
              </Link>
              <Link
                href="/dashboard/admin/ai-services"
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="mr-3">🤖</span>
                Configurar IA
              </Link>
            </div>
          </div>

          {/* Alertas del Sistema */}
          {hasAutomationWarning && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 p-6">
              <div className="flex items-start space-x-3">
                <span className="text-xl flex-shrink-0">⚠️</span>
                <div>
                  <h4 className="text-sm font-semibold text-yellow-800">
                    Atención Requerida
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    {automation?.autoPurchase.status !== 'healthy' 
                      ? 'El sistema de compra automática tiene problemas.'
                      : 'El motor de sincronización tiene errores.'}
                    {' '}Revisa la configuración.
                  </p>
                  <Link
                    href="/dashboard/admin/automation"
                    className="inline-flex items-center text-sm font-medium text-yellow-800 hover:text-yellow-900 mt-2"
                  >
                    Revisar ahora →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
