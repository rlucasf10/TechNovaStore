/**
 * Componente de Cards de Métricas
 * 
 * Muestra las métricas clave de una campaña en cards visuales:
 * - Productos con descuento
 * - Descuento promedio
 * - Unidades vendidas
 * - Ingresos totales
 * - Tasa de conversión
 * - ROI
 * 
 * Requirements: 15.1, 15.5, 15.6
 */

'use client';

import type { AggregatedMetrics } from '@/shared/types';

interface MetricsCardsProps {
  metrics: AggregatedMetrics;
}

// Formatear moneda en euros
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

// Formatear número con separadores de miles
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-ES').format(value);
};

// Formatear porcentaje
const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

export function MetricsCards({ metrics }: MetricsCardsProps) {
  // Definir las métricas a mostrar
  const metricsData = [
    {
      label: 'Productos con Descuento',
      value: formatNumber(metrics.productsWithDiscount),
      icon: '🏷️',
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-700',
      valueColor: 'text-blue-900',
    },
    {
      label: 'Descuento Promedio',
      value: formatPercentage(metrics.averageDiscountPercentage),
      icon: '💰',
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-700',
      valueColor: 'text-green-900',
    },
    {
      label: 'Unidades Vendidas',
      value: formatNumber(metrics.totalUnitsSold || 0),
      icon: '📦',
      color: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-700',
      valueColor: 'text-purple-900',
    },
    {
      label: 'Ingresos Totales',
      value: formatCurrency(metrics.totalRevenue),
      icon: '💵',
      color: 'bg-yellow-50 border-yellow-200',
      textColor: 'text-yellow-700',
      valueColor: 'text-yellow-900',
    },
    {
      label: 'Tasa de Conversión',
      value: formatPercentage(metrics.conversionRate * 100),
      icon: '📈',
      color: 'bg-indigo-50 border-indigo-200',
      textColor: 'text-indigo-700',
      valueColor: 'text-indigo-900',
      description: 'Conversiones / Clics',
    },
    {
      label: 'ROI',
      value: formatPercentage(metrics.roi),
      icon: '🎯',
      color: metrics.roi >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200',
      textColor: metrics.roi >= 0 ? 'text-emerald-700' : 'text-red-700',
      valueColor: metrics.roi >= 0 ? 'text-emerald-900' : 'text-red-900',
      description: '(Ingresos - Descuentos) / Descuentos',
    },
  ];

  // Métricas secundarias
  const secondaryMetrics = [
    {
      label: 'Visualizaciones',
      value: formatNumber(metrics.totalViews),
      icon: '👁️',
    },
    {
      label: 'Clics',
      value: formatNumber(metrics.totalClicks),
      icon: '👆',
    },
    {
      label: 'Conversiones',
      value: formatNumber(metrics.totalConversions),
      icon: '✅',
    },
    {
      label: 'Descuento Total',
      value: formatCurrency(metrics.totalDiscountAmount || 0),
      icon: '🔖',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metricsData.map((metric, index) => (
          <div
            key={index}
            className={`${metric.color} border rounded-lg p-4 transition-transform hover:scale-105`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{metric.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${metric.valueColor}`}>
              {metric.value}
            </p>
            <p className={`text-sm ${metric.textColor} mt-1`}>
              {metric.label}
            </p>
            {metric.description && (
              <p className="text-xs text-gray-500 mt-1">
                {metric.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Métricas secundarias */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Métricas de Engagement
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {secondaryMetrics.map((metric, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
            >
              <span className="text-xl">{metric.icon}</span>
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {metric.value}
                </p>
                <p className="text-xs text-gray-500">{metric.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
