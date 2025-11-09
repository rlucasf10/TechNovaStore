/**
 * Ejemplos de uso del componente AdminRoute
 * 
 * Este archivo contiene ejemplos de cómo usar AdminRoute en diferentes escenarios.
 * NO importar este archivo en producción, es solo para referencia.
 */

import { AdminRoute } from './AdminRoute';

// ============================================================================
// Ejemplo 1: Uso Básico
// ============================================================================

export function Example1_BasicUsage() {
  return (
    <AdminRoute>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Panel de Administración</h1>
        <p className="text-gray-600">
          Solo los administradores pueden ver este contenido.
        </p>
      </div>
    </AdminRoute>
  );
}

// ============================================================================
// Ejemplo 2: Con Redirecciones Personalizadas
// ============================================================================

export function Example2_CustomRedirects() {
  return (
    <AdminRoute 
      loginRedirect="/login?admin=true"
      unauthorizedRedirect="/dashboard"
    >
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Configuración del Sistema</h1>
        <p className="text-gray-600">
          Redirige a dashboard si no es admin, en lugar de unauthorized.
        </p>
      </div>
    </AdminRoute>
  );
}

// ============================================================================
// Ejemplo 3: Sin URL de Retorno
// ============================================================================

export function Example3_NoReturnUrl() {
  return (
    <AdminRoute includeReturnUrl={false}>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Página de Admin</h1>
        <p className="text-gray-600">
          No incluye la URL actual en la redirección a login.
        </p>
      </div>
    </AdminRoute>
  );
}

// ============================================================================
// Ejemplo 4: En Layout de Admin
// ============================================================================

export function Example4_AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRoute>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 text-white p-6">
          <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
          <nav className="space-y-2">
            <a href="/admin" className="block py-2 px-4 rounded hover:bg-gray-800">
              Dashboard
            </a>
            <a href="/admin/users" className="block py-2 px-4 rounded hover:bg-gray-800">
              Usuarios
            </a>
            <a href="/admin/products" className="block py-2 px-4 rounded hover:bg-gray-800">
              Productos
            </a>
            <a href="/admin/orders" className="block py-2 px-4 rounded hover:bg-gray-800">
              Pedidos
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 bg-gray-50">
          {children}
        </main>
      </div>
    </AdminRoute>
  );
}

// ============================================================================
// Ejemplo 5: Página de Admin Dashboard
// ============================================================================

export function Example5_AdminDashboard() {
  return (
    <AdminRoute>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard de Administración</h1>
        
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm mb-2">Ventas del Día</h3>
            <p className="text-3xl font-bold">$12,345</p>
            <p className="text-green-600 text-sm mt-2">+15% vs ayer</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm mb-2">Pedidos Activos</h3>
            <p className="text-3xl font-bold">48</p>
            <p className="text-blue-600 text-sm mt-2">12 pendientes</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm mb-2">Tickets Abiertos</h3>
            <p className="text-3xl font-bold">23</p>
            <p className="text-red-600 text-sm mt-2">5 urgentes</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm mb-2">Usuarios Activos</h3>
            <p className="text-3xl font-bold">1,234</p>
            <p className="text-green-600 text-sm mt-2">+8% esta semana</p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Ventas por Día</h3>
            <div className="h-64 flex items-center justify-center text-gray-400">
              [Gráfico de ventas]
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Productos Más Vendidos</h3>
            <div className="h-64 flex items-center justify-center text-gray-400">
              [Gráfico de productos]
            </div>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}

// ============================================================================
// Ejemplo 6: Página de Gestión de Usuarios (Admin)
// ============================================================================

export function Example6_UserManagement() {
  return (
    <AdminRoute>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Agregar Usuario
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Buscar por email..."
              className="border rounded px-3 py-2"
            />
            <select className="border rounded px-3 py-2">
              <option>Todos los roles</option>
              <option>Admin</option>
              <option>Usuario</option>
            </select>
            <select className="border rounded px-3 py-2">
              <option>Todos los estados</option>
              <option>Activo</option>
              <option>Inactivo</option>
            </select>
            <button className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-300"></div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        Juan Pérez
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  juan@example.com
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                    Admin
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Activo
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">
                    Editar
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    Eliminar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AdminRoute>
  );
}

// ============================================================================
// Ejemplo 7: Combinado con ProtectedRoute (Anidado)
// ============================================================================

export function Example7_NestedProtection() {
  // Este ejemplo muestra que AdminRoute ya incluye la protección de autenticación
  // No es necesario anidar ProtectedRoute dentro de AdminRoute
  
  return (
    <AdminRoute>
      {/* AdminRoute ya verifica autenticación Y rol de admin */}
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Configuración Avanzada</h1>
        <p className="text-gray-600">
          Este contenido está protegido por AdminRoute.
          No necesitas ProtectedRoute adicional.
        </p>
      </div>
    </AdminRoute>
  );
}

// ============================================================================
// Ejemplo 8: Uso en Next.js App Router
// ============================================================================

// app/admin/page.tsx
export function Example8_NextJsAppRouter() {
  return (
    <AdminRoute>
      <div className="p-8">
        <h1 className="text-3xl font-bold">Admin Home</h1>
      </div>
    </AdminRoute>
  );
}

// app/admin/layout.tsx
export function Example8_NextJsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Proteger todo el layout de admin
  return (
    <AdminRoute>
      <div className="admin-layout">
        <header className="bg-gray-900 text-white p-4">
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </header>
        <div className="flex">
          <aside className="w-64 bg-gray-100 min-h-screen p-4">
            <nav>
              <a href="/admin" className="block py-2">Dashboard</a>
              <a href="/admin/users" className="block py-2">Usuarios</a>
              <a href="/admin/settings" className="block py-2">Configuración</a>
            </nav>
          </aside>
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </div>
    </AdminRoute>
  );
}
