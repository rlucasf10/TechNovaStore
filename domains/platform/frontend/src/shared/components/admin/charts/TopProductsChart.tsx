/**
 * Gráfico de Productos Más Vendidos
 * 
 * Muestra los top 10 productos más vendidos en un gráfico de barras horizontal.
 * 
 * Requisitos: 15.1
 */

'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  TooltipProps,
} from 'recharts';

interface TopProduct {
  name: string;
  sales: number;
  units: number;
}

interface TopProductsChartProps {
  data: TopProduct[];
  isLoading?: boolean;
}

const COLORS = [
  '#3b82f6', // blue-500
  '#8b5cf6', // purple-500
  '#ec4899', // pink-500
  '#f59e0b', // amber-500
  '#10b981', // green-500
  '#06b6d4', // cyan-500
  '#6366f1', // indigo-500
  '#f97316', // orange-500
  '#14b8a6', // teal-500
  '#a855f7', // purple-600
];

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as TopProduct;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-600 mt-1">
          Ventas: <span className="font-semibold text-green-600">€{data.sales.toFixed(2)}</span>
        </p>
        <p className="text-sm text-gray-600">
          Unidades: <span className="font-semibold text-blue-600">{data.units}</span>
        </p>
      </div>
    );
  }
  return null;
}

export function TopProductsChart({ data, isLoading }: TopProductsChartProps) {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Cargando datos...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
        <div className="text-center">
          <span className="text-4xl mb-2 block">📦</span>
          <p className="text-sm">No hay datos de productos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 100, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
        <YAxis
          type="category"
          dataKey="name"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          width={90}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="sales" radius={[0, 4, 4, 0]} animationDuration={500}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
