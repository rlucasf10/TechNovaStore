/**
 * Store de Autenticación con Zustand
 * 
 * Maneja el estado de autenticación del usuario:
 * - Usuario actual
 * - Estado de autenticación
 * - Métodos de autenticación vinculados
 * 
 * ✅ SEGURIDAD: Este store NO verifica tokens en localStorage.
 * La autenticación se maneja exclusivamente mediante httpOnly cookies
 * que son gestionadas automáticamente por el navegador y el backend.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  avatar?: string;
  authMethods?: Array<{
    type: 'password' | 'google' | 'github';
    providerId?: string;
    linkedAt: Date;
    lastUsed?: Date;
  }>;
}

interface AuthState {
  // Estado
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Acciones
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      isLoading: true,
      
      // Acciones
      setUser: (user: User | null) => set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false,
      }),
      
      setLoading: (isLoading: boolean) => set({ isLoading }),
      
      logout: () => set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: false,
      }),
      
      reset: () => set({ 
        user: null, 
        isAuthenticated: false,
        isLoading: true,
      }),
    }),
    {
      name: 'auth-storage',
      // Solo persistir datos no sensibles
      partialize: (state: AuthState) => ({
        user: state.user ? {
          id: state.user.id,
          email: state.user.email,
          firstName: state.user.firstName,
          lastName: state.user.lastName,
          role: state.user.role,
          avatar: state.user.avatar,
        } : null,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // ✅ SEGURIDAD: NO verificamos tokens en localStorage.
        // La autenticación se valida mediante httpOnly cookies en el backend.
        // Si la cookie expiró, la próxima petición al backend retornará 401
        // y el interceptor de axios manejará el logout automáticamente.
        if (state) {
          state.isLoading = false;
        }
      },
    }
  )
);
