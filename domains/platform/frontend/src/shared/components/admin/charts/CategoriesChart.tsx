/**
 * Gráfico de Categorías Más Populares
 * 
 * Muestra las categorías más populares en un gráfico de dona (pie chart).
 * 
 * Requisitos: 15.1
 */

'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  TooltipProps,
} from 'recharts';

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
}

interface CategoriesChartProps {
  data: CategoryData[];
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
];

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as CategoryData;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-600 mt-1">
          Ventas: <span className="font-semibold text-blue-600">{data.value}</span>
        </p>
        <p className="text-sm text-gray-600">
          Porcentaje: <span className="font-semibold text-purple-600">{data.percentage.toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
}

export function CategoriesChart({ data, isLoading }: CategoriesChartProps) {
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
          <span className="text-4xl mb-2 block">📊</span>
          <p className="text-sm">No hay datos de categorías disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          fill="#8884d8"
          paddingAngle={2}
          dataKey="value"
          label={({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}
          labelLine={true}
          animationDuration={500}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          formatter={(value) => <span className="text-sm text-gray-700">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
