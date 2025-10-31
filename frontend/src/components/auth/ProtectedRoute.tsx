/**
 * ProtectedRoute Component
 * 
 * Componente para proteger rutas que requieren autenticación.
 * Verifica si el usuario está autenticado y redirige a login si no lo está.
 * Muestra un spinner mientras verifica el estado de autenticación.
 * 
 * Uso:
 * ```tsx
 * <ProtectedRoute>
 *   <DashboardPage />
 * </ProtectedRoute>
 * ```
 * 
 * Con redirección personalizada:
 * ```tsx
 * <ProtectedRoute redirectTo="/login?from=/dashboard">
 *   <DashboardPage />
 * </ProtectedRoute>
 * ```
 */

'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingPage } from '@/components/ui/Loading';

// ============================================================================
// Tipos
// ============================================================================

interface ProtectedRouteProps {
  /** Contenido a proteger */
  children: React.ReactNode;
  /** URL a la que redirigir si no está autenticado (por defecto: /login) */
  redirectTo?: string;
  /** Si debe incluir la URL actual como parámetro 'from' en la redirección */
  includeReturnUrl?: boolean;
}

// ============================================================================
// Componente ProtectedRoute
// ============================================================================

export function ProtectedRoute({
  children,
  redirectTo = '/login',
  includeReturnUrl = true,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, status } = useAuth();

  useEffect(() => {
    // Solo redirigir si ya terminó de cargar y el usuario no está autenticado
    if (!isLoading && !isAuthenticated) {
      // Construir URL de redirección
      let redirectUrl = redirectTo;
      
      // Agregar parámetro 'from' para redirigir de vuelta después del login
      if (includeReturnUrl && pathname) {
        const separator = redirectTo.includes('?') ? '&' : '?';
        redirectUrl = `${redirectTo}${separator}from=${encodeURIComponent(pathname)}`;
      }
      
      router.push(redirectUrl);
    }
  }, [isLoading, isAuthenticated, router, redirectTo, pathname, includeReturnUrl]);

  // Mostrar spinner mientras verifica autenticación
  if (isLoading || status === 'loading') {
    return <LoadingPage />;
  }

  // Si no está autenticado, mostrar spinner mientras redirige
  // (evita flash de contenido protegido)
  if (!isAuthenticated) {
    return <LoadingPage />;
  }

  // Usuario autenticado, mostrar contenido protegido
  return <>{children}</>;
}

export default ProtectedRoute;
