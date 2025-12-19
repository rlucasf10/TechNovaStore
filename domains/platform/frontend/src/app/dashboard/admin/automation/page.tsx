/**
 * Página de Automatización del Dashboard de Administración
 * 
 * Muestra el estado y métricas de los sistemas de automatización:
 * - Sync Engine
 * - Auto Purchase System
 * - Shipment Tracker
 * 
 * Requisitos: 15.3, 46.1, 46.2, 46.3
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { automationService } from '@/services/automationService';
import type {
  SyncEngineStatus,
  AutoPurchaseStats,
  ShipmentTrackerStats,
  ProviderInfo,
} from '@/services/automationService';

type ServiceHealthStatus = 'healthy' | 'warning' | 'error' | 'unknown';

// ============================================================================
// Utilidades
// ============================================================================

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return 'Nunca';
  
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

// ============================================================================
// Componentes de Tarjetas
// ============================================================================

function SyncEngineCard({
  status,
  providers,
  isLoading,
  onPause,
  onResume,
  onSync,
}: {
  status: SyncEngineStatus | undefined;
  providers: ProviderInfo[] | undefined;
  isLoading: boolean;
  onPause: () => Promise<void>;
  onResume: () => Promise<void>;
  onSync: () => Promise<void>;
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (action: () => Promise<void>) => {
    setIsProcessing(true);
    try {
      await action();
    } catch (error) {
      console.error('Error executing action:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="w-48 h-6 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="w-full h-4 bg-gray-200 rounded" />
          <div className="w-3/4 h-4 bg-gray-200 rounded" />
          <div className="w-1/2 h-4 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const statusColors: Record<ServiceHealthStatus, string> = {
    healthy: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    unknown: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const statusColor = statusColors[status?.status || 'unknown'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
            🔄
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Sync Engine
            </h3>
            <p className="text-sm text-gray-500">
              Sincronización de productos
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColor}`}>
          {status?.status === 'healthy' ? 'Operativo' :
           status?.status === 'warning' ? 'Advertencia' :
           status?.status === 'error' ? 'Error' : 'Desconocido'}
        </span>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Última Sincronización</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatTimeAgo(status?.lastSync || null)}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Productos Sincronizados</p>
          <p className="text-lg font-semibold text-gray-900">
            {status?.productsSynced.toLocaleString('es-ES') || 0}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Errores de Sincronización</p>
          <p className={`text-lg font-semibold ${
            (status?.syncErrors || 0) > 0 ? 'text-red-600' : 'text-gray-900'
          }`}>
            {status?.syncErrors || 0}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Próxima Sincronización</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatTimeAgo(status?.nextSync || null)}
          </p>
        </div>
      </div>

      {/* Proveedores activos */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Proveedores Activos ({status?.activeProviders.length || 0})
        </h4>
        <div className="flex flex-wrap gap-2">
          {status?.activeProviders && status.activeProviders.length > 0 ? (
            status.activeProviders.map((provider) => (
              <span
                key={provider}
                className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full"
              >
                {provider}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-500">No hay proveedores activos</span>
          )}
        </div>
      </div>

      {/* Detalles de proveedores */}
      {providers && providers.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Detalles de Proveedores
          </h4>
          <div className="space-y-2">
            {providers.map((provider: ProviderInfo) => (
              <div
                key={provider.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    provider.enabled ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  <span className="text-sm font-medium text-gray-700">
                    {provider.name}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{provider.productsCount} productos</span>
                  <span className={provider.errorRate > 0 ? 'text-red-600' : ''}>
                    {provider.errorRate.toFixed(1)}% errores
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-3">
        {status?.isRunning ? (
          <button
            onClick={() => handleAction(onPause)}
            disabled={isProcessing}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {isProcessing ? 'Pausando...' : '⏸ Pausar'}
          </button>
        ) : (
          <button
            onClick={() => handleAction(onResume)}
            disabled={isProcessing}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {isProcessing ? 'Reanudando...' : '▶ Reanudar'}
          </button>
        )}
        <button
          onClick={() => handleAction(onSync)}
          disabled={isProcessing}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm font-medium"
        >
          {isProcessing ? 'Sincronizando...' : '🔄 Sincronizar Ahora'}
        </button>
        <button
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          ⚙️ Configurar
        </button>
      </div>
    </div>
  );
}

function AutoPurchaseCard({
  stats,
  isLoading,
  onProcessPending,
}: {
  stats: AutoPurchaseStats | undefined;
  isLoading: boolean;
  onProcessPending: () => Promise<void>;
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcessPending = async () => {
    setIsProcessing(true);
    try {
      await onProcessPending();
    } catch (error) {
      console.error('Error processing pending orders:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="w-48 h-6 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="w-full h-4 bg-gray-200 rounded" />
          <div className="w-3/4 h-4 bg-gray-200 rounded" />
          <div className="w-1/2 h-4 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const statusColors: Record<ServiceHealthStatus, string> = {
    healthy: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    unknown: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const statusColor = statusColors[stats?.status || 'unknown'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
            🤖
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Auto Purchase System
            </h3>
            <p className="text-sm text-gray-500">
              Compras automáticas
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColor}`}>
          {stats?.status === 'healthy' ? 'Operativo' :
           stats?.status === 'warning' ? 'Advertencia' :
           stats?.status === 'error' ? 'Error' : 'Desconocido'}
        </span>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Compras Hoy</p>
          <p className="text-lg font-semibold text-gray-900">
            {stats?.purchasesToday || 0}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Tasa de Éxito</p>
          <p className={`text-lg font-semibold ${
            (stats?.successRate || 0) >= 90 ? 'text-green-600' :
            (stats?.successRate || 0) >= 70 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {stats?.successRate.toFixed(1) || 0}%
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Pedidos Pendientes</p>
          <p className={`text-lg font-semibold ${
            (stats?.pendingOrders || 0) > 10 ? 'text-yellow-600' : 'text-gray-900'
          }`}>
            {stats?.pendingOrders || 0}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Total Procesados</p>
          <p className="text-lg font-semibold text-gray-900">
            {stats?.totalProcessed.toLocaleString('es-ES') || 0}
          </p>
        </div>
      </div>

      {/* Estadísticas adicionales */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-green-600 mb-1">Exitosos</p>
          <p className="text-lg font-semibold text-green-700">
            {stats?.totalSuccess.toLocaleString('es-ES') || 0}
          </p>
        </div>
        <div className="p-3 bg-red-50 rounded-lg">
          <p className="text-xs text-red-600 mb-1">Fallidos</p>
          <p className="text-lg font-semibold text-red-700">
            {stats?.totalFailed.toLocaleString('es-ES') || 0}
          </p>
        </div>
      </div>

      {/* Errores recientes */}
      {stats?.recentErrors && stats.recentErrors.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Errores Recientes ({stats.recentErrors.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {stats.recentErrors.map((error: { orderId: string; error: string; timestamp: string }, index: number) => (
              <div
                key={index}
                className="p-3 bg-red-50 border border-red-100 rounded-lg"
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="text-sm font-medium text-red-900">
                    Pedido #{error.orderId}
                  </span>
                  <span className="text-xs text-red-600">
                    {formatTimeAgo(error.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-red-700">{error.error}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleProcessPending}
          disabled={isProcessing || (stats?.pendingOrders || 0) === 0}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 text-sm font-medium"
        >
          {isProcessing ? 'Procesando...' : '▶ Procesar Pendientes'}
        </button>
        <button
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          ⚙️ Configurar
        </button>
      </div>
    </div>
  );
}

function ShipmentTrackerCard({
  stats,
  isLoading,
}: {
  stats: ShipmentTrackerStats | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="w-48 h-6 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          <div className="w-full h-4 bg-gray-200 rounded" />
          <div className="w-3/4 h-4 bg-gray-200 rounded" />
          <div className="w-1/2 h-4 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const statusColors: Record<ServiceHealthStatus, string> = {
    healthy: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    unknown: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const statusColor = statusColors[stats?.status || 'unknown'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-2xl">
            📦
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Shipment Tracker
            </h3>
            <p className="text-sm text-gray-500">
              Seguimiento de envíos
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColor}`}>
          {stats?.status === 'healthy' ? 'Operativo' :
           stats?.status === 'warning' ? 'Advertencia' :
           stats?.status === 'error' ? 'Error' : 'Desconocido'}
        </span>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Envíos Rastreados</p>
          <p className="text-lg font-semibold text-gray-900">
            {stats?.shipmentsTracked.toLocaleString('es-ES') || 0}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Actualizaciones Hoy</p>
          <p className="text-lg font-semibold text-gray-900">
            {stats?.updatesToday || 0}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Entregas Completadas</p>
          <p className="text-lg font-semibold text-green-600">
            {stats?.deliveriesCompleted || 0}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">Retrasos Detectados</p>
          <p className={`text-lg font-semibold ${
            (stats?.delaysDetected || 0) > 0 ? 'text-red-600' : 'text-gray-900'
          }`}>
            {stats?.delaysDetected || 0}
          </p>
        </div>
      </div>

      {/* Estadísticas adicionales */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-600 mb-1">Envíos Activos</p>
          <p className="text-lg font-semibold text-blue-700">
            {stats?.activeShipments || 0}
          </p>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg">
          <p className="text-xs text-purple-600 mb-1">Tiempo Promedio</p>
          <p className="text-lg font-semibold text-purple-700">
            {stats?.averageDeliveryTime || 0} días
          </p>
        </div>
      </div>

      {/* Alerta de retrasos */}
      {stats && stats.delaysDetected > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h4 className="text-sm font-semibold text-yellow-800">
                Retrasos Detectados
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Hay {stats.delaysDetected} envío{stats.delaysDetected > 1 ? 's' : ''} con retrasos.
                Revisa los detalles para tomar acción.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-3">
        <button
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
        >
          📊 Ver Detalles
        </button>
        <button
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          ⚙️ Configurar
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Componente Principal
// ============================================================================

export default function AutomationPage() {
  // Obtener datos de los servicios de automatización
  const { data: syncStatus, isLoading: isLoadingSync, refetch: refetchSync } = useQuery({
    queryKey: ['sync-engine-status'],
    queryFn: () => automationService.getSyncEngineStatus(),
    refetchInterval: 30000, // Actualizar cada 30 segundos
  });

  const { data: providers, isLoading: isLoadingProviders } = useQuery({
    queryKey: ['sync-engine-providers'],
    queryFn: () => automationService.getProviders(),
    refetchInterval: 60000, // Actualizar cada minuto
  });

  const { data: autoPurchaseStats, isLoading: isLoadingAutoPurchase, refetch: refetchAutoPurchase } = useQuery({
    queryKey: ['auto-purchase-stats'],
    queryFn: () => automationService.getAutoPurchaseStats(),
    refetchInterval: 30000,
  });

  const { data: shipmentStats, isLoading: isLoadingShipment, refetch: refetchShipment } = useQuery({
    queryKey: ['shipment-tracker-stats'],
    queryFn: () => automationService.getShipmentTrackerStats(),
    refetchInterval: 30000,
  });

  // Handlers para acciones
  const handlePauseSync = async () => {
    await automationService.pauseSync();
    await refetchSync();
  };

  const handleResumeSync = async () => {
    await automationService.resumeSync();
    await refetchSync();
  };

  const handleTriggerSync = async () => {
    await automationService.triggerFullSync();
    await refetchSync();
  };

  const handleProcessPending = async () => {
    await automationService.processPendingOrders();
    await refetchAutoPurchase();
  };

  const handleRefreshAll = async () => {
    await Promise.all([
      refetchSync(),
      refetchAutoPurchase(),
      refetchShipment(),
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Automatización
          </h2>
          <p className="text-gray-500 mt-1">
            Gestión de sistemas de automatización
          </p>
        </div>
        <button
          onClick={handleRefreshAll}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <span className="mr-2">🔄</span>
          Actualizar Todo
        </button>
      </div>

      {/* Tarjetas de automatización */}
      <div className="space-y-6">
        {/* Sync Engine */}
        <SyncEngineCard
          status={syncStatus}
          providers={providers}
          isLoading={isLoadingSync || isLoadingProviders}
          onPause={handlePauseSync}
          onResume={handleResumeSync}
          onSync={handleTriggerSync}
        />

        {/* Auto Purchase System */}
        <AutoPurchaseCard
          stats={autoPurchaseStats}
          isLoading={isLoadingAutoPurchase}
          onProcessPending={handleProcessPending}
        />

        {/* Shipment Tracker */}
        <ShipmentTrackerCard
          stats={shipmentStats}
          isLoading={isLoadingShipment}
        />
      </div>
    </div>
  );
}
