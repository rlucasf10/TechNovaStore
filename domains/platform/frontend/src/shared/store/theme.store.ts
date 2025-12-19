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
    (set, get) => {
      // Inicializar con el tema del sistema si no hay preferencia guardada
      const initialTheme: Theme = 'system';
      const initialResolved = resolveTheme(initialTheme);
      
      return {
        // Estado inicial
        theme: initialTheme,
        resolvedTheme: initialResolved,
        
        // Acciones
        setTheme: (theme: Theme) => {
          const resolved = resolveTheme(theme);
          set({ theme, resolvedTheme: resolved });
          
          // Aplicar clase al documento
          if (typeof document !== 'undefined') {
            document.documentElement.classList.remove('light', 'dark');
            document.documentElement.classList.add(resolved);
            
            // Actualizar meta theme-color para navegadores móviles
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
              metaThemeColor.setAttribute('content', resolved === 'dark' ? '#0f172a' : '#ffffff');
            }
          }
        },
        
        toggleTheme: () => {
          const currentResolved = get().resolvedTheme;
          const newTheme = currentResolved === 'light' ? 'dark' : 'light';
          get().setTheme(newTheme);
        },
      };
    },
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state: ThemeState | undefined) => {
        // Aplicar tema al cargar
        if (state && typeof document !== 'undefined') {
          const resolved = resolveTheme(state.theme);
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(resolved);
          
          // Actualizar meta theme-color
          const metaThemeColor = document.querySelector('meta[name="theme-color"]');
          if (metaThemeColor) {
            metaThemeColor.setAttribute('content', resolved === 'dark' ? '#0f172a' : '#ffffff');
          }
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
