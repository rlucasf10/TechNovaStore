/**
 * Gráfico de Ventas por Día
 * 
 * Muestra las ventas de los últimos 30 días en un gráfico de líneas.
 * Incluye tooltip con información detallada.
 * 
 * Requisitos: 15.1
 */

'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SalesDataPoint {
  date: string;
  sales: number;
  orders: number;
}

interface SalesChartProps {
  data: SalesDataPoint[];
  isLoading?: boolean;
}

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as SalesDataPoint;
    const sales = typeof data.sales === 'number' ? data.sales : Number(data.sales) || 0;
    const orders = typeof data.orders === 'number' ? data.orders : Number(data.orders) || 0;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900">
          {format(new Date(data.date), 'dd MMM yyyy', { locale: es })}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Ventas: <span className="font-semibold text-green-600">€{sales.toFixed(2)}</span>
        </p>
        <p className="text-sm text-gray-600">
          Pedidos: <span className="font-semibold text-blue-600">{orders}</span>
        </p>
      </div>
    );
  }
  return null;
}

export function SalesChart({ data, isLoading }: SalesChartProps) {
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
          <span className="text-4xl mb-2 block">📈</span>
          <p className="text-sm">No hay datos de ventas disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tickFormatter={(date: string) => format(new Date(date), 'dd MMM', { locale: es })}
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          tickFormatter={(value: number) => `€${value}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="sales"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6 }}
          animationDuration={500}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
