/**
 * Ejemplos de uso del componente ProtectedRoute
 * 
 * Este archivo muestra diferentes casos de uso del componente ProtectedRoute
 * para proteger rutas que requieren autenticación.
 */

'use client';

import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

// ============================================================================
// Ejemplo 1: Uso Básico
// ============================================================================

export function BasicProtectedRouteExample() {
  return (
    <ProtectedRoute>
      <div className="p-8">
        <h1 className="text-2xl font-bold">Contenido Protegido</h1>
        <p className="text-gray-600 mt-2">
          Este contenido solo es visible para usuarios autenticados.
        </p>
      </div>
    </ProtectedRoute>
  );
}

// ============================================================================
// Ejemplo 2: Dashboard de Usuario
// ============================================================================

function DashboardContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido, {user?.firstName}
        </h1>
        <p className="text-gray-600 mt-2">
          Este es tu panel de control personal
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900">Mis Pedidos</h3>
            <p className="text-gray-600 mt-2">Ver historial de pedidos</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900">Mi Perfil</h3>
            <p className="text-gray-600 mt-2">Gestionar información personal</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900">Configuración</h3>
            <p className="text-gray-600 mt-2">Ajustes de cuenta</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardExample() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

// ============================================================================
// Ejemplo 3: Con Redirección Personalizada
// ============================================================================

export function CustomRedirectExample() {
  return (
    <ProtectedRoute redirectTo="/auth/signin">
      <div className="p-8">
        <h1 className="text-2xl font-bold">Página Especial</h1>
        <p className="text-gray-600 mt-2">
          Redirige a /auth/signin en lugar de /login
        </p>
      </div>
    </ProtectedRoute>
  );
}

// ============================================================================
// Ejemplo 4: Sin URL de Retorno
// ============================================================================

export function NoReturnUrlExample() {
  return (
    <ProtectedRoute includeReturnUrl={false}>
      <div className="p-8">
        <h1 className="text-2xl font-bold">Configuración de Seguridad</h1>
        <p className="text-gray-600 mt-2">
          No incluye parámetro 'from' en la redirección
        </p>
      </div>
    </ProtectedRoute>
  );
}

// ============================================================================
// Ejemplo 5: Layout Protegido
// ============================================================================

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold">Mi Aplicación</h1>
          </div>
        </header>

        {/* Contenido */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-auto">
          <div className="max-w-7xl mx-auto px-4 py-4 text-center text-gray-600">
            © 2025 TechNovaStore
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}

// ============================================================================
// Ejemplo 6: Página de Perfil
// ============================================================================

function ProfileContent() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Mi Perfil</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nombre
          </label>
          <p className="mt-1 text-gray-900">
            {user?.firstName} {user?.lastName}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <p className="mt-1 text-gray-900">{user?.email}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Rol
          </label>
          <p className="mt-1 text-gray-900 capitalize">{user?.role}</p>
        </div>
      </div>
    </div>
  );
}

export function ProfilePageExample() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

// ============================================================================
// Ejemplo 7: Página de Pedidos
// ============================================================================

function OrdersContent() {
  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Mis Pedidos</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Número
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                #12345
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                25 Oct 2025
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  Entregado
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                $299.99
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function OrdersPageExample() {
  return (
    <ProtectedRoute>
      <OrdersContent />
    </ProtectedRoute>
  );
}

// ============================================================================
// Ejemplo 8: Uso en Next.js App Router
// ============================================================================

/**
 * Ejemplo de uso en una página de Next.js App Router
 * 
 * Archivo: app/dashboard/page.tsx
 */
export function NextJsPageExample() {
  return (
    <ProtectedRoute>
      <div className="p-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Esta página está protegida con ProtectedRoute
        </p>
      </div>
    </ProtectedRoute>
  );
}

/**
 * Ejemplo de uso en un layout de Next.js App Router
 * 
 * Archivo: app/dashboard/layout.tsx
 */
export function NextJsLayoutExample({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="dashboard-layout">
        <aside className="w-64 bg-gray-800 text-white p-4">
          <nav>
            <ul className="space-y-2">
              <li>
                <a href="/dashboard" className="block p-2 hover:bg-gray-700 rounded">
                  Resumen
                </a>
              </li>
              <li>
                <a href="/dashboard/orders" className="block p-2 hover:bg-gray-700 rounded">
                  Pedidos
                </a>
              </li>
              <li>
                <a href="/dashboard/profile" className="block p-2 hover:bg-gray-700 rounded">
                  Perfil
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}

// ============================================================================
// Ejemplo 9: Con Mensaje de Error
// ============================================================================

export function WithErrorMessageExample() {
  return (
    <ProtectedRoute redirectTo="/login?error=session_expired">
      <div className="p-8">
        <h1 className="text-2xl font-bold">Sesión Expirada</h1>
        <p className="text-gray-600 mt-2">
          Redirige con mensaje de error personalizado
        </p>
      </div>
    </ProtectedRoute>
  );
}

// ============================================================================
// Ejemplo 10: Múltiples Niveles de Protección
// ============================================================================

export function NestedProtectionExample() {
  return (
    <ProtectedRoute>
      <div className="p-8">
        <h1 className="text-2xl font-bold">Nivel 1 - Autenticado</h1>

        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 className="text-xl font-semibold">Nivel 2 - Contenido Anidado</h2>
          <p className="text-gray-600 mt-2">
            Este contenido también está protegido por el ProtectedRoute padre
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
