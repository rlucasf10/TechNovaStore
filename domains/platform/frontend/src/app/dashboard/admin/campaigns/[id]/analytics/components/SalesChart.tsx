/**
 * Componente de Gráfico de Ventas Diarias
 * 
 * Muestra un gráfico de líneas con las ventas diarias durante la campaña.
 * Utiliza SVG nativo para evitar dependencias externas.
 * 
 * Requirements: 15.2
 */

'use client';

import { useMemo } from 'react';
import type { CampaignAnalytics } from '@/shared/types';

interface SalesChartProps {
  dailyMetrics: CampaignAnalytics[];
}

// Formatear moneda en euros
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Formatear fecha corta
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
  });
};

export function SalesChart({ dailyMetrics }: SalesChartProps) {
  // Ordenar métricas por fecha
  const sortedMetrics = useMemo(() => {
    return [...dailyMetrics].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [dailyMetrics]);

  // Calcular dimensiones y escalas
  const chartData = useMemo(() => {
    if (sortedMetrics.length === 0) {
      return { points: [], maxRevenue: 0, minRevenue: 0 };
    }

    const revenues = sortedMetrics.map((m) => m.revenue);
    const maxRevenue = Math.max(...revenues, 1);
    const minRevenue = Math.min(...revenues, 0);

    // Dimensiones del gráfico
    const width = 600;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Calcular puntos
    const points = sortedMetrics.map((metric, index) => {
      const x = padding.left + (index / Math.max(sortedMetrics.length - 1, 1)) * chartWidth;
      const y = padding.top + chartHeight - ((metric.revenue - minRevenue) / (maxRevenue - minRevenue || 1)) * chartHeight;
      return { x, y, metric };
    });

    return { points, maxRevenue, minRevenue, width, height, padding, chartWidth, chartHeight };
  }, [sortedMetrics]);

  // Generar path para la línea
  const linePath = useMemo(() => {
    if (chartData.points.length === 0) return '';
    return chartData.points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
  }, [chartData.points]);

  // Generar path para el área bajo la línea
  const areaPath = useMemo(() => {
    if (chartData.points.length === 0 || !chartData.height || !chartData.padding) return '';
    const { points, height, padding } = chartData;
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const bottomY = height - padding.bottom;
    
    return `${linePath} L ${lastPoint.x} ${bottomY} L ${firstPoint.x} ${bottomY} Z`;
  }, [linePath, chartData]);

  if (sortedMetrics.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📈 Ventas Diarias
        </h3>
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay datos de ventas disponibles</p>
        </div>
      </div>
    );
  }

  const { width = 600, height = 300, padding = { top: 20, right: 20, bottom: 40, left: 60 }, maxRevenue, points } = chartData;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📈 Ventas Diarias
      </h3>
      
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[400px]"
          style={{ maxHeight: '350px' }}
        >
          {/* Líneas de cuadrícula horizontales */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = padding.top + (1 - ratio) * (height - padding.top - padding.bottom);
            const value = maxRevenue * ratio;
            return (
              <g key={index}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeDasharray="4,4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-500"
                >
                  {formatCurrency(value)}
                </text>
              </g>
            );
          })}

          {/* Área bajo la línea */}
          <path
            d={areaPath}
            fill="url(#gradient)"
            opacity="0.3"
          />

          {/* Línea principal */}
          <path
            d={linePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Puntos de datos */}
          {points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill="#3b82f6"
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer hover:r-7 transition-all"
              />
              {/* Tooltip al hover */}
              <title>
                {formatDate(point.metric.date)}: {formatCurrency(point.metric.revenue)}
              </title>
            </g>
          ))}

          {/* Etiquetas del eje X */}
          {points.map((point, index) => {
            // Mostrar solo algunas etiquetas para evitar superposición
            if (points.length > 10 && index % Math.ceil(points.length / 7) !== 0) {
              return null;
            }
            return (
              <text
                key={index}
                x={point.x}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {formatDate(point.metric.date)}
              </text>
            );
          })}

          {/* Gradiente para el área */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Leyenda */}
      <div className="flex items-center justify-center mt-4 space-x-4 text-sm text-gray-600">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span>Ingresos diarios</span>
        </div>
      </div>
    </div>
  );
}
