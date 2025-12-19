/**
 * Mini Gráfico de Tendencia para KPIs
 * 
 * Componente pequeño que muestra la tendencia de un KPI en los últimos días.
 * Se usa dentro de las tarjetas de KPIs del dashboard de administración.
 * 
 * Requisitos: 15.1
 */

'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface MiniTrendChartProps {
  data: number[];
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function MiniTrendChart({ data, color = '#3b82f6', trend = 'neutral' }: MiniTrendChartProps) {
  // Convertir array de números a formato de recharts
  const chartData = data.map((value, index) => ({
    index,
    value,
  }));

  // Determinar color basado en tendencia
  const lineColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : color;

  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={lineColor}
          strokeWidth={2}
          dot={false}
          animationDuration={300}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
