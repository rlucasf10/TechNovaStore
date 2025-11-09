/**
 * Store del Tema con Zustand
 * 
 * Maneja el estado del tema (claro/oscuro):
 * - Tema actual
 * - Preferencia del usuario
 * - Sincronización con preferencia del sistema
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  // Estado
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  
  // Acciones
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Helper para obtener el tema del sistema
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Helper para resolver el tema
const resolveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      theme: 'system',
      resolvedTheme: 'light',
      
      // Acciones
      setTheme: (theme: Theme) => {
        const resolved = resolveTheme(theme);
        set({ theme, resolvedTheme: resolved });
        
        // Aplicar clase al documento
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(resolved);
        }
      },
      
      toggleTheme: () => {
        const currentResolved = get().resolvedTheme;
        const newTheme = currentResolved === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state: ThemeState | undefined) => {
        // Aplicar tema al cargar
        if (state && typeof document !== 'undefined') {
          const resolved = resolveTheme(state.theme);
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(resolved);
        }
      },
    }
  )
);

// Escuchar cambios en la preferencia del sistema
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const store = useThemeStore.getState();
    if (store.theme === 'system') {
      const newResolved = e.matches ? 'dark' : 'light';
      useThemeStore.setState({ resolvedTheme: newResolved });
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(newResolved);
    }
  });
}
