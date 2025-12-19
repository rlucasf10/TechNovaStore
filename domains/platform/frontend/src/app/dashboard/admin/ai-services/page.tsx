/**
 * Página de Servicios de IA - Dashboard de Administración
 * 
 * Muestra métricas detalladas del Chatbot y Recommender con datos en tiempo real.
 * Protegida por AdminRoute a través del layout.
 * Usa polling cada 30 segundos para mantener datos actualizados.
 * 
 * Requisitos: 15.2
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useChatbotMetrics,
  useRecommenderMetrics,
  type ServiceHealthStatus,
  type ChatbotLogEntry,
} from '@/features/admin';
import { adminService } from '@/features/admin/services/adminService';

// ============================================================================
// Tipos
// ============================================================================

interface MetricCard {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  change?: string;
}

// ============================================================================
// Componentes auxiliares
// ============================================================================

function StatusBadge({ status }: { status: ServiceHealthStatus }) {
  const config = {
    healthy: { bg: 'bg-green-100', text: 'text-green-700', label: 'Operativo' },
    warning: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Degradado' },
    error: { bg: 'bg-red-100', text: 'text-red-700', label: 'Error' },
    unknown: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Desconocido' },
  };

  const { bg, text, label } = config[status];

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${bg} ${text}`}>
      <span className="w-2 h-2 rounded-full bg-current mr-2" />
      {label}
    </span>
  );
}

function MetricCardComponent({ metric }: { metric: MetricCard }) {
  const trendIcon = metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→';
  const trendColor = metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : 'text-gray-600';

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{metric.label}</span>
        {metric.change && (
          <span className={`text-xs font-medium ${trendColor}`}>
            {trendIcon} {metric.change}
          </span>
        )}
      </div>
      <div className="flex items-baseline">
        <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
        {metric.unit && <span className="ml-1 text-sm text-gray-500">{metric.unit}</span>}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="space-y-4">
        <div className="h-32 bg-gray-200 rounded" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Componente Principal
// ============================================================================

export default function AIServicesPage() {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [chatbotLogs, setChatbotLogs] = useState<ChatbotLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [restartResult, setRestartResult] = useState<{ success: boolean; message: string } | null>(null);

  // Obtener métricas con polling automático
  const { data: chatbotMetrics, isLoading: isLoadingChatbot, refetch: refetchChatbot } = useChatbotMetrics();
  const { data: recommenderMetrics, isLoading: isLoadingRecommender, refetch: refetchRecommender } = useRecommenderMetrics();

  const isLoading = isLoadingChatbot || isLoadingRecommender;

  // Función para cargar logs del chatbot
  const handleViewLogs = async () => {
    setIsLoadingLogs(true);
    setShowLogsModal(true);
    try {
      const logs = await adminService.getChatbotLogs(100);
      setChatbotLogs(logs);
    } catch (error) {
      console.error('Error cargando logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Función para reiniciar el chatbot
  const handleRestartChatbot = async () => {
    setIsRestarting(true);
    setRestartResult(null);
    try {
      const result = await adminService.restartChatbot();
      setRestartResult(result);
      if (result.success) {
        // Refrescar métricas después del reinicio
        setTimeout(() => {
          refetchChatbot();
        }, 1000);
      }
    } catch (error) {
      setRestartResult({ success: false, message: 'Error al reiniciar el servicio' });
    } finally {
      setIsRestarting(false);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([refetchChatbot(), refetchRecommender()]);
    setLastUpdate(new Date());
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard/admin"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Volver
            </Link>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
            🤖 Servicios de IA
          </h2>
          <p className="text-gray-500 mt-1">
            Última actualización: {formatTimeAgo(lastUpdate)}
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

      {/* Contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tarjeta del Chatbot */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {isLoadingChatbot ? (
            <LoadingSkeleton />
          ) : (
            <>
              {/* Header de la tarjeta */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <span className="mr-2">💬</span>
                    Chatbot IA
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Sistema de asistencia con IA
                  </p>
                </div>
                <StatusBadge status={chatbotMetrics?.status || 'unknown'} />
              </div>

              {/* Estado de los modelos */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Estado de Modelos</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ollama (Phi-3 Mini):</span>
                    <span className={`text-sm font-medium ${chatbotMetrics?.ollamaAvailable ? 'text-green-600' : 'text-red-600'}`}>
                      {chatbotMetrics?.ollamaAvailable ? '✓ Disponible' : '✗ No disponible'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Gemini (2.5-flash):</span>
                    <span className={`text-sm font-medium ${chatbotMetrics?.geminiAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                      {chatbotMetrics?.geminiAvailable ? '✓ Conectado' : '○ No configurado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Modo Básico (Fallback):</span>
                    <span className="text-sm font-medium text-green-600">
                      ✓ Disponible
                    </span>
                  </div>
                  {chatbotMetrics?.usingFallback && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      ⚠️ Actualmente usando modo básico
                    </div>
                  )}
                </div>
              </div>

              {/* Métricas */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Métricas de Rendimiento</h4>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCardComponent
                    metric={{
                      label: 'Solicitudes',
                      value: chatbotMetrics?.messagesProcessed.toLocaleString('es-ES') || '0',
                    }}
                  />
                  <MetricCardComponent
                    metric={{
                      label: 'Tasa de éxito',
                      value: chatbotMetrics ? ((1 - chatbotMetrics.errorRate) * 100).toFixed(1) : '0',
                      unit: '%',
                    }}
                  />
                  <MetricCardComponent
                    metric={{
                      label: 'Tiempo promedio',
                      value: chatbotMetrics?.averageResponseTime.toFixed(0) || '0',
                      unit: 'ms',
                    }}
                  />
                  <MetricCardComponent
                    metric={{
                      label: 'Uso de fallback',
                      value: chatbotMetrics?.fallbackUsagePercent.toFixed(1) || '0',
                      unit: '%',
                    }}
                  />
                </div>
              </div>

              {/* Sesiones activas */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Sesiones activas</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {chatbotMetrics?.activeSessions || 0}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total de sesiones</p>
                    <p className="text-lg font-semibold text-gray-700">
                      {chatbotMetrics?.totalSessions.toLocaleString('es-ES') || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Último modelo usado */}
              <div className="text-sm text-gray-500">
                <span className="font-medium">Último modelo usado:</span>{' '}
                <span className="text-gray-700">{chatbotMetrics?.lastModelUsed || 'N/A'}</span>
              </div>

              {/* Acciones */}
              <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                <button
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  onClick={handleViewLogs}
                >
                  📋 Ver Logs
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                  onClick={() => setShowRestartModal(true)}
                >
                  🔄 Reiniciar Servicio
                </button>
              </div>
            </>
          )}
        </div>

        {/* Tarjeta del Recommender */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {isLoadingRecommender ? (
            <LoadingSkeleton />
          ) : (
            <>
              {/* Header de la tarjeta */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <span className="mr-2">🎯</span>
                    Recommender
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Sistema de recomendaciones
                  </p>
                </div>
                <StatusBadge status={recommenderMetrics?.status || 'unknown'} />
              </div>

              {/* Métricas principales */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Métricas de Rendimiento</h4>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCardComponent
                    metric={{
                      label: 'Recomendaciones',
                      value: recommenderMetrics?.totalRecommendations.toLocaleString('es-ES') || '0',
                    }}
                  />
                  <MetricCardComponent
                    metric={{
                      label: 'Cache Hit Rate',
                      value: recommenderMetrics ? (recommenderMetrics.cacheHitRate * 100).toFixed(1) : '0',
                      unit: '%',
                    }}
                  />
                  <MetricCardComponent
                    metric={{
                      label: 'Tiempo promedio',
                      value: recommenderMetrics?.averageResponseTime.toFixed(0) || '0',
                      unit: 'ms',
                    }}
                  />
                  <MetricCardComponent
                    metric={{
                      label: 'Interacciones',
                      value: recommenderMetrics?.interactionsProcessed.toLocaleString('es-ES') || '0',
                    }}
                  />
                </div>
              </div>

              {/* Modelos activos */}
              <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Modelos Activos</h4>
                {recommenderMetrics?.activeModels && recommenderMetrics.activeModels.length > 0 ? (
                  <div className="space-y-2">
                    {recommenderMetrics.activeModels.map((model, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
                        <span className="text-gray-700">{model}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No hay modelos activos</p>
                )}
              </div>

              {/* Última actualización de modelo */}
              {recommenderMetrics?.lastModelUpdate && (
                <div className="mb-6 text-sm text-gray-500">
                  <span className="font-medium">Última actualización:</span>{' '}
                  <span className="text-gray-700">
                    {new Date(recommenderMetrics.lastModelUpdate).toLocaleString('es-ES')}
                  </span>
                </div>
              )}

              {/* Estadísticas adicionales */}
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Tasa de clics</p>
                    <p className="text-lg font-bold text-green-600">
                      {recommenderMetrics ? ((recommenderMetrics.interactionsProcessed / Math.max(recommenderMetrics.totalRecommendations, 1)) * 100).toFixed(1) : '0'}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Conversión</p>
                    <p className="text-lg font-bold text-green-600">
                      {recommenderMetrics ? ((recommenderMetrics.interactionsProcessed / Math.max(recommenderMetrics.totalRecommendations, 1)) * 50).toFixed(1) : '0'}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                <button
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  onClick={() => alert('Funcionalidad de logs en desarrollo')}
                >
                  📋 Ver Logs
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                  onClick={() => alert('Funcionalidad de configuración en desarrollo')}
                >
                  ⚙️ Configurar
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-xl flex-shrink-0">ℹ️</span>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">
              Acerca de los Servicios de IA
            </h4>
            <p className="text-sm text-blue-800">
              El <strong>Chatbot</strong> utiliza modelos de IA (Ollama Phi-3 o Gemini) para proporcionar asistencia inteligente a los usuarios.
              Si los modelos principales no están disponibles, el sistema automáticamente usa un modo básico de respaldo.
            </p>
            <p className="text-sm text-blue-800 mt-2">
              El <strong>Recommender</strong> analiza el comportamiento de los usuarios para generar recomendaciones personalizadas de productos,
              mejorando la experiencia de compra y aumentando las conversiones.
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Logs */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">📋 Logs del Chatbot</h3>
              <button
                onClick={() => setShowLogsModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {isLoadingLogs ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-3 text-gray-600">Cargando logs...</span>
                </div>
              ) : chatbotLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay logs disponibles
                </div>
              ) : (
                <div className="space-y-2 font-mono text-sm">
                  {chatbotLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded ${
                        log.level === 'error' ? 'bg-red-50 text-red-800' :
                        log.level === 'warn' ? 'bg-yellow-50 text-yellow-800' :
                        'bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="text-gray-500">{new Date(log.timestamp).toLocaleString('es-ES')}</span>
                      <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${
                        log.level === 'error' ? 'bg-red-200' :
                        log.level === 'warn' ? 'bg-yellow-200' :
                        'bg-gray-200'
                      }`}>
                        {log.level.toUpperCase()}
                      </span>
                      <span className="ml-2">{log.message}</span>
                      {log.details && (
                        <span className="ml-2 text-gray-500">
                          {JSON.stringify(log.details)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end gap-3">
              <button
                onClick={handleViewLogs}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
              >
                🔄 Refrescar
              </button>
              <button
                onClick={() => setShowLogsModal(false)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reinicio */}
      {showRestartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Reiniciar Servicio del Chatbot
              </h3>
              {restartResult ? (
                <div className={`p-4 rounded-lg mb-4 ${
                  restartResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  <p className="text-center">
                    {restartResult.success ? '✓' : '✗'} {restartResult.message}
                  </p>
                </div>
              ) : (
                <p className="text-gray-600 text-center mb-4">
                  Esta acción limpiará todas las sesiones activas y reseteará las métricas del chatbot.
                  ¿Estás seguro de que deseas continuar?
                </p>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => {
                  setShowRestartModal(false);
                  setRestartResult(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
              >
                {restartResult ? 'Cerrar' : 'Cancelar'}
              </button>
              {!restartResult && (
                <button
                  onClick={handleRestartChatbot}
                  disabled={isRestarting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {isRestarting ? 'Reiniciando...' : '🔄 Reiniciar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
