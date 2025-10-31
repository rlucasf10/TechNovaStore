/**
 * Página principal del Dashboard de Administración
 * 
 * Muestra KPIs y métricas generales del sistema.
 * Protegida por AdminRoute a través del layout.
 */

'use client';

// Iconos simples sin dependencias externas

export default function AdminDashboardPage() {
  // Datos de ejemplo (en producción vendrían del backend)
  const kpis = [
    {
      name: 'Ventas del Día',
      value: '$12,345',
      change: '+15%',
      trend: 'up' as const,
      icon: '💰',
    },
    {
      name: 'Pedidos Activos',
      value: '48',
      change: '+8%',
      trend: 'up' as const,
      icon: '🛒',
    },
    {
      name: 'Tickets Abiertos',
      value: '23',
      change: '-12%',
      trend: 'down' as const,
      icon: '💬',
    },
    {
      name: 'Usuarios Activos',
      value: '1,234',
      change: '+5%',
      trend: 'up' as const,
      icon: '👥',
    },
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-8">
        Resumen General
      </h2>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi) => {
          const trendColor = kpi.trend === 'up' ? 'text-green-600' : 'text-red-600';
          const trendIcon = kpi.trend === 'up' ? '↗' : '↘';

          return (
            <div
              key={kpi.name}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                  {kpi.icon}
                </div>
                <div className={`flex items-center ${trendColor}`}>
                  <span className="text-lg mr-1">{trendIcon}</span>
                  <span className="text-sm font-semibold">{kpi.change}</span>
                </div>
              </div>
              <h3 className="text-gray-500 text-sm mb-1">{kpi.name}</h3>
              <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por Día */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ventas por Día (Últimos 30 días)
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded">
            [Gráfico de ventas - Implementar con Chart.js o Recharts]
          </div>
        </div>

        {/* Productos Más Vendidos */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Productos Más Vendidos (Top 10)
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded">
            [Gráfico de productos - Implementar con Chart.js o Recharts]
          </div>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Actividad Reciente
        </h3>
        <div className="space-y-4">
          {[
            { type: 'order', message: 'Nuevo pedido #1234 recibido', time: 'Hace 5 minutos' },
            { type: 'ticket', message: 'Ticket #567 marcado como urgente', time: 'Hace 15 minutos' },
            { type: 'user', message: 'Nuevo usuario registrado: juan@example.com', time: 'Hace 30 minutos' },
            { type: 'product', message: 'Producto "Laptop Dell XPS" actualizado', time: 'Hace 1 hora' },
          ].map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                <p className="text-sm text-gray-700">{activity.message}</p>
              </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
