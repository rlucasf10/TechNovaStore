/**
 * Configuración del Sistema de Diseño - TechNovaStore
 * 
 * Este archivo centraliza toda la configuración del tema visual,
 * incluyendo colores, tipografía, espaciado y breakpoints.
 * 
 * Requisitos: 21.1, 21.2, 21.3, 21.4
 */

export const themeConfig = {
  /**
   * Paleta de Colores
   */
  colors: {
    // Colores Primarios (Azul)
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    
    // Colores de Acento (Púrpura)
    accent: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
      950: '#2e1065',
    },
    
    // Colores Neutros (Grises)
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },
    
    // Colores Semánticos
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    
    // Tema Oscuro
    dark: {
      bg: {
        primary: '#0f172a',
        secondary: '#1e293b',
        tertiary: '#334155',
      },
      text: {
        primary: '#f1f5f9',
        secondary: '#cbd5e1',
      },
      primary: '#60a5fa',
      accent: '#a78bfa',
    },
  },

  /**
   * Tipografía
   */
  typography: {
    // Familias de fuentes
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      display: ['Inter', 'system-ui', 'sans-serif'],
    },
    
    // Tamaños de texto
    fontSize: {
      xs: { size: '0.75rem', lineHeight: '1rem' },      // 12px
      sm: { size: '0.875rem', lineHeight: '1.25rem' },  // 14px
      base: { size: '1rem', lineHeight: '1.5rem' },     // 16px
      lg: { size: '1.125rem', lineHeight: '1.75rem' },  // 18px
      xl: { size: '1.25rem', lineHeight: '1.75rem' },   // 20px
      '2xl': { size: '1.5rem', lineHeight: '2rem' },    // 24px
      '3xl': { size: '1.875rem', lineHeight: '2.25rem' }, // 30px
      '4xl': { size: '2.25rem', lineHeight: '2.5rem' }, // 36px
      '5xl': { size: '3rem', lineHeight: '1' },         // 48px
    },
    
    // Pesos de fuente
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  /**
   * Sistema de Espaciado (basado en 4px)
   */
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    32: '8rem',     // 128px
  },

  /**
   * Breakpoints Responsivos
   */
  breakpoints: {
    xs: '475px',    // Móvil pequeño
    sm: '640px',    // Móvil grande
    md: '768px',    // Tablet
    lg: '1024px',   // Desktop pequeño
    xl: '1280px',   // Desktop
    '2xl': '1536px', // Desktop grande
  },

  /**
   * Bordes Redondeados
   */
  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px
    DEFAULT: '0.375rem', // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px',
  },

  /**
   * Sombras
   */
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
  },

  /**
   * Transiciones
   */
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slower: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  /**
   * Z-Index
   */
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },

  /**
   * Animaciones
   */
  animations: {
    fadeIn: 'fadeIn 0.5s ease-in-out',
    slideUp: 'slideUp 0.3s ease-out',
    slideDown: 'slideDown 0.3s ease-out',
    slideInRight: 'slideInRight 0.3s ease-out',
    slideInLeft: 'slideInLeft 0.3s ease-out',
    pulseSubtle: 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    shimmer: 'shimmer 2s linear infinite',
    spin: 'spin 1s linear infinite',
    bounce: 'bounce 1s infinite',
  },

  /**
   * Tamaños de Elementos Interactivos (Accesibilidad)
   */
  interactiveSize: {
    minTouch: '44px', // Tamaño mínimo para elementos táctiles (WCAG)
    minClick: '24px', // Tamaño mínimo para elementos clickeables
  },

  /**
   * Contraste de Colores (Accesibilidad WCAG 2.1)
   */
  contrast: {
    minNormal: 4.5,  // Contraste mínimo para texto normal (AA)
    minLarge: 3,     // Contraste mínimo para texto grande (AA)
    enhanced: 7,     // Contraste mejorado (AAA)
  },
} as const;

/**
 * Tipos TypeScript para el tema
 */
export type ThemeConfig = typeof themeConfig;
export type ColorScale = keyof typeof themeConfig.colors.primary;
export type SemanticColor = keyof typeof themeConfig.colors.semantic;
export type Breakpoint = keyof typeof themeConfig.breakpoints;
export type Spacing = keyof typeof themeConfig.spacing;

/**
 * Helper para obtener valores del tema
 */
export const getThemeValue = <T extends keyof ThemeConfig>(
  category: T,
  key: string
): unknown => {
  const categoryObj = themeConfig[category] as Record<string, unknown>;
  return key.split('.').reduce((obj: unknown, k: string) => (obj as Record<string, unknown>)?.[k], categoryObj);
};

/**
 * Helper para verificar si estamos en modo oscuro
 */
export const isDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
};

/**
 * Helper para alternar modo oscuro
 */
export const toggleDarkMode = (): void => {
  if (typeof window === 'undefined') return;
  document.documentElement.classList.toggle('dark');
  localStorage.setItem(
    'theme',
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
};

/**
 * Helper para inicializar el tema desde localStorage
 */
export const initializeTheme = (): void => {
  if (typeof window === 'undefined') return;
  
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export default themeConfig;
