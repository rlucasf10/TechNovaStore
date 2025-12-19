/**
 * Gráfico de Embudo de Conversión
 * 
 * Muestra el embudo de conversión desde visitas hasta compras completadas.
 * 
 * Requisitos: 15.1
 */

'use client';

interface FunnelStage {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface ConversionFunnelChartProps {
  data: FunnelStage[];
  isLoading?: boolean;
}

export function ConversionFunnelChart({ data, isLoading }: ConversionFunnelChartProps) {
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
          <span className="text-4xl mb-2 block">🎯</span>
          <p className="text-sm">No hay datos de conversión disponibles</p>
        </div>
      </div>
    );
  }

  // Calcular el ancho máximo (primera etapa)
  const maxValue = data[0]?.value || 1;

  return (
    <div className="space-y-3 py-4">
      {data.map((stage, index) => {
        const widthPercentage = (stage.value / maxValue) * 100;
        const dropoff = index > 0 ? data[index - 1].value - stage.value : 0;
        const dropoffPercentage = index > 0 ? ((dropoff / data[index - 1].value) * 100).toFixed(1) : '0';

        return (
          <div key={stage.name} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">{stage.name}</span>
              <div className="flex items-center space-x-3">
                <span className="text-gray-900 font-semibold">
                  {stage.value.toLocaleString('es-ES')}
                </span>
                <span className="text-gray-500">
                  ({stage.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
              <div
                className="h-full flex items-center justify-center text-white font-medium text-sm transition-all duration-500"
                style={{
                  width: `${widthPercentage}%`,
                  backgroundColor: stage.color,
                }}
              >
                {widthPercentage > 20 && `${stage.percentage.toFixed(0)}%`}
              </div>
            </div>
            {index > 0 && dropoff > 0 && (
              <div className="text-xs text-red-600 flex items-center space-x-1">
                <span>↓</span>
                <span>
                  Pérdida: {dropoff.toLocaleString('es-ES')} ({dropoffPercentage}%)
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
