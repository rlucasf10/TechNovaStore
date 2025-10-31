/**
 * Hook useAuth
 * 
 * Hook personalizado para gestionar el estado de autenticación con React Query.
 * Proporciona métodos para login, logout, register y checkAuth.
 * Integra React Query para caché y sincronización con Zustand para estado global.
 * 
 * Características:
 * - Caché de usuario autenticado con React Query
 * - Sincronización automática con Zustand store
 * - Manejo de estados: loading, authenticated, unauthenticated
 * - Métodos optimistas para mejor UX
 * - Manejo de errores consistente
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { queryKeys } from '@/lib/react-query';
import type {
  User,
  LoginCredentials,
  RegisterData,
  AuthError,
  AuthStatus,
} from '@/types/auth.types';

// ============================================================================
// Tipos del Hook
// ============================================================================

interface UseAuthReturn {
  // Estado
  user: User | null;
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  isUnauthenticated: boolean;
  error: AuthError | null;
  
  // Métodos
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<User>;
  checkAuth: () => Promise<User | null>;
  refetch: () => Promise<void>;
  
  // Estados de mutaciones
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  isRegistering: boolean;
}

// ============================================================================
// Hook useAuth
// ============================================================================

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, logout: storeLogout } = useAuthStore();

  // ============================================================================
  // Query: Obtener usuario actual
  // ============================================================================

  const {
    data: user,
    isLoading: isCheckingAuth,
    error: authError,
    refetch: refetchUser,
  } = useQuery<User | null, AuthError>({
    queryKey: queryKeys.auth.user,
    queryFn: async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        return currentUser;
      } catch (error) {
        // Si hay cualquier error, simplemente retornar null
        // NO mostrar errores en consola para evitar ruido cuando no hay sesión
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
    retry: false, // No reintentar si falla la autenticación
    refetchOnWindowFocus: false, // NO verificar al enfocar ventana (evita llamadas innecesarias)
    refetchOnMount: false, // NO verificar al montar (evita llamadas innecesarias en páginas públicas)
  });

  // Sincronizar con Zustand store
  React.useEffect(() => {
    if (user !== undefined) {
      setUser(user);
    }
  }, [user, setUser]);

  // ============================================================================
  // Mutation: Login
  // ============================================================================

  const loginMutation = useMutation<User, AuthError, LoginCredentials>({
    mutationFn: async (credentials: LoginCredentials) => {
      return await authService.login(credentials);
    },
    onSuccess: (user) => {
      // Actualizar caché de React Query
      queryClient.setQueryData(queryKeys.auth.user, user);
      
      // Actualizar Zustand store
      setUser(user);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
      
      // Redirigir al dashboard
      router.push('/dashboard');
    },
    onError: (error) => {
      console.error('Login error:', error);
    },
  });

  // ============================================================================
  // Mutation: Logout
  // ============================================================================

  const logoutMutation = useMutation<void, AuthError, void>({
    mutationFn: async () => {
      await authService.logout();
    },
    onSuccess: () => {
      // Limpiar caché de React Query
      queryClient.setQueryData(queryKeys.auth.user, null);
      queryClient.clear(); // Limpiar todo el caché
      
      // Limpiar Zustand store
      storeLogout();
      
      // Redirigir a login
      router.push('/login');
    },
    onError: (error) => {
      console.error('Logout error:', error);
      
      // Incluso si hay error, limpiar estado local
      queryClient.setQueryData(queryKeys.auth.user, null);
      storeLogout();
      router.push('/login');
    },
  });

  // ============================================================================
  // Mutation: Register
  // ============================================================================

  const registerMutation = useMutation<User, AuthError, RegisterData>({
    mutationFn: async (data: RegisterData) => {
      return await authService.register(data);
    },
    onSuccess: (user) => {
      // Actualizar caché de React Query
      queryClient.setQueryData(queryKeys.auth.user, user);
      
      // Actualizar Zustand store
      setUser(user);
      
      // Redirigir al dashboard
      router.push('/dashboard');
    },
    onError: (error) => {
      console.error('Register error:', error);
    },
  });

  // ============================================================================
  // Métodos del Hook
  // ============================================================================

  const login = async (credentials: LoginCredentials): Promise<User> => {
    return await loginMutation.mutateAsync(credentials);
  };

  const logout = async (): Promise<void> => {
    await logoutMutation.mutateAsync();
  };

  const register = async (data: RegisterData): Promise<User> => {
    return await registerMutation.mutateAsync(data);
  };

  const checkAuth = async (): Promise<User | null> => {
    const result = await refetchUser();
    return result.data ?? null;
  };

  const refetch = async (): Promise<void> => {
    await refetchUser();
  };

  // ============================================================================
  // Calcular estado de autenticación
  // ============================================================================

  const isLoading = isCheckingAuth || loginMutation.isPending || logoutMutation.isPending || registerMutation.isPending;
  const isAuthenticated = !!user;
  const isUnauthenticated = !user && !isLoading;

  let status: AuthStatus = 'loading';
  if (isLoading) {
    status = 'loading';
  } else if (isAuthenticated) {
    status = 'authenticated';
  } else {
    status = 'unauthenticated';
  }

  // ============================================================================
  // Retornar interfaz del hook
  // ============================================================================

  return {
    // Estado
    user: user ?? null,
    status,
    isLoading,
    isAuthenticated,
    isUnauthenticated,
    error: authError ?? loginMutation.error ?? registerMutation.error ?? null,
    
    // Métodos
    login,
    logout,
    register,
    checkAuth,
    refetch,
    
    // Estados de mutaciones
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}

// ============================================================================
// Hook auxiliar: useRequireAuth
// ============================================================================

/**
 * Hook para proteger rutas que requieren autenticación.
 * Redirige a login si el usuario no está autenticado.
 */
export function useRequireAuth(): UseAuthReturn {
  const router = useRouter();
  const auth = useAuth();

  React.useEffect(() => {
    if (auth.isUnauthenticated) {
      router.push('/login');
    }
  }, [auth.isUnauthenticated, router]);

  return auth;
}

// ============================================================================
// Hook auxiliar: useRequireAdmin
// ============================================================================

/**
 * Hook para proteger rutas que requieren rol de administrador.
 * Redirige a unauthorized si el usuario no es admin.
 */
export function useRequireAdmin(): UseAuthReturn {
  const router = useRouter();
  const auth = useAuth();

  React.useEffect(() => {
    if (auth.isUnauthenticated) {
      router.push('/login');
    } else if (auth.user && auth.user.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [auth.isUnauthenticated, auth.user, router]);

  return auth;
}

// Importar React para useEffect
import React from 'react';

export default useAuth;
