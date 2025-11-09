/**
 * Theme Context
 * 
 * Proveedor de contexto para el tema de la aplicación (claro/oscuro/sistema).
 * Sincroniza con el store de Zustand y aplica la clase al documento.
 */

'use client'

import React, { createContext, useContext, useEffect } from 'react'
import { useThemeStore, type Theme } from '@/store/theme.store'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, resolvedTheme, toggleTheme, setTheme } = useThemeStore()
  
  // Aplicar tema al documento
  useEffect(() => {
    const root = document.documentElement
    
    // Remover ambas clases primero
    root.classList.remove('light', 'dark')
    
    // Agregar la clase del tema resuelto
    root.classList.add(resolvedTheme)
  }, [resolvedTheme])
  
  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    toggleTheme,
    setTheme,
  }
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  
  if (context === undefined) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider')
  }
  
  return context
}
