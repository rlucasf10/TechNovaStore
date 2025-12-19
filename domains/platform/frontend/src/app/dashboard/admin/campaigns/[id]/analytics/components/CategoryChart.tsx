/**
 * Componente de Gráfico de Categorías
 * 
 * Muestra un gráfico de barras con las categorías más vendidas durante la campaña.
 * Utiliza SVG nativo para evitar dependencias externas.
 * 
 * Requirements: 15.3
 */

'use client';

import { useMemo } from 'react';
import type { CategorySales } from '@/shared/types';

interface CategoryChartProps {
  categorySales: CategorySales[];
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

// Colores para las barras
const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

export function CategoryChart({ categorySales }: CategoryChartProps) {
  // Ordenar por ingresos y tomar las top 8
  const sortedCategories = useMemo(() => {
    return [...categorySales]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [categorySales]);

  // Calcular dimensiones y escalas
  const chartData = useMemo(() => {
    if (sortedCategories.length === 0) {
      return { bars: [], maxRevenue: 0 };
    }

    const maxRevenue = Math.max(...sortedCategories.map((c) => c.revenue), 1);

    // Dimensiones del gráfico
    const width = 600;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 80, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Calcular barras
    const barWidth = chartWidth / sortedCategories.length - 10;
    const bars = sortedCategories.map((category, index) => {
      const x = padding.left + index * (chartWidth / sortedCategories.length) + 5;
      const barHeight = (category.revenue / maxRevenue) * chartHeight;
      const y = padding.top + chartHeight - barHeight;
      return {
        x,
        y,
        width: barWidth,
        height: barHeight,
        category,
        color: COLORS[index % COLORS.length],
      };
    });

    return { bars, maxRevenue, width, height, padding, chartHeight };
  }, [sortedCategories]);

  if (sortedCategories.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📊 Categorías Más Vendidas
        </h3>
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No hay datos de categorías disponibles</p>
        </div>
      </div>
    );
  }

  const { bars, maxRevenue, width = 600, height = 300, padding = { top: 20, right: 20, bottom: 80, left: 60 }, chartHeight = 200 } = chartData;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📊 Categorías Más Vendidas
      </h3>
      
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[400px]"
          style={{ maxHeight: '350px' }}
        >
          {/* Líneas de cuadrícula horizontales */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = padding.top + (1 - ratio) * chartHeight;
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

          {/* Barras */}
          {bars.map((bar, index) => (
            <g key={index}>
              {/* Barra */}
              <rect
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                fill={bar.color}
                rx="4"
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
              
              {/* Valor encima de la barra */}
              <text
                x={bar.x + bar.width / 2}
                y={bar.y - 5}
                textAnchor="middle"
                className="text-xs fill-gray-700 font-medium"
              >
                {formatCurrency(bar.category.revenue)}
              </text>
              
              {/* Etiqueta de categoría */}
              <text
                x={bar.x + bar.width / 2}
                y={height - padding.bottom + 15}
                textAnchor="middle"
                className="text-xs fill-gray-600"
                transform={`rotate(-45, ${bar.x + bar.width / 2}, ${height - padding.bottom + 15})`}
              >
                {bar.category.category.length > 12
                  ? bar.category.category.substring(0, 12) + '...'
                  : bar.category.category}
              </text>
              
              {/* Tooltip */}
              <title>
                {bar.category.category}: {formatCurrency(bar.category.revenue)} ({bar.category.unitsSold} unidades)
              </title>
            </g>
          ))}
        </svg>
      </div>

      {/* Leyenda con detalles */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        {bars.map((bar, index) => (
          <div
            key={index}
            className="flex items-center space-x-2 text-sm"
          >
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: bar.color }}
            ></div>
            <span className="text-gray-600 truncate" title={bar.category.category}>
              {bar.category.category}
            </span>
            <span className="text-gray-400 text-xs">
              ({bar.category.unitsSold})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
