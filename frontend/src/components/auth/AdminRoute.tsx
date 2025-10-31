/**
 * AdminRoute Component
 * 
 * Componente para proteger rutas que requieren rol de administrador.
 * Verifica si el usuario está autenticado y tiene rol de admin.
 * Redirige a login si no está autenticado o a unauthorized si no es admin.
 * Muestra un spinner mientras verifica el estado de autenticación.
 * 
 * Uso:
 * ```tsx
 * <AdminRoute>
 *   <AdminDashboardPage />
 * </AdminRoute>
 * ```
 * 
 * Con redirección personalizada:
 * ```tsx
 * <AdminRoute 
 *   loginRedirect="/login?from=/admin"
 *   unauthorizedRedirect="/dashboard"
 * >
 *   <AdminDashboardPage />
 * </AdminRoute>
 * ```
 */

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingPage } from '@/components/ui';

// ============================================================================
// Tipos
// ============================================================================

interface AdminRouteProps {
  /** Contenido a proteger */
  children: React.ReactNode;
  /** URL a la que redirigir si no está autenticado (por defecto: /login) */
  loginRedirect?: string;
  /** URL a la que redirigir si no es admin (por defecto: /unauthorized) */
  unauthorizedRedirect?: string;
  /** Si debe incluir la URL actual como parámetro 'from' en la redirección */
  includeReturnUrl?: boolean;
}

// ============================================================================
// Componente AdminRoute
// ============================================================================

export function AdminRoute({
  children,
  loginRedirect = '/login',
  unauthorizedRedirect = '/unauthorized',
  includeReturnUrl = true,
}: AdminRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, status, user } = useAuth();

  useEffect(() => {
    // Solo redirigir si ya terminó de cargar
    if (!isLoading && status !== 'loading') {
      // Si no está autenticado, redirigir a login
      if (!isAuthenticated) {
        // Construir URL de redirección a login
        let redirectUrl = loginRedirect;
        
        // Agregar parámetro 'from' para redirigir de vuelta después del login
        if (includeReturnUrl && pathname) {
          const separator = loginRedirect.includes('?') ? '&' : '?';
          redirectUrl = `${loginRedirect}${separator}from=${encodeURIComponent(pathname)}`;
        }
        
        router.push(redirectUrl);
        return;
      }

      // Si está autenticado pero no es admin, redirigir a unauthorized
      if (user && user.role !== 'admin') {
        router.push(unauthorizedRedirect);
        return;
      }
    }
  }, [
    isLoading,
    status,
    isAuthenticated,
    user,
    router,
    loginRedirect,
    unauthorizedRedirect,
    pathname,
    includeReturnUrl,
  ]);

  // Mostrar spinner mientras verifica autenticación
  if (isLoading || status === 'loading') {
    return <LoadingPage />;
  }

  // Si no está autenticado, mostrar spinner mientras redirige
  // (evita flash de contenido protegido)
  if (!isAuthenticated) {
    return <LoadingPage />;
  }

  // Si está autenticado pero no es admin, mostrar spinner mientras redirige
  if (user && user.role !== 'admin') {
    return <LoadingPage />;
  }

  // Usuario autenticado y es admin, mostrar contenido protegido
  return <>{children}</>;
}

export default AdminRoute;
