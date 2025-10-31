/**
 * Store de Autenticación con Zustand
 * 
 * Maneja el estado de autenticación del usuario:
 * - Usuario actual
 * - Estado de autenticación
 * - Métodos de autenticación vinculados
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
    }
  )
);
