'use client'

import React from 'react'
import { useChatStore } from '@/support/store/chat.store'

interface AIProviderToggleProps {
  className?: string
}

/**
 * Toggle Material Design 3 para cambiar entre Gemini y modo básico
 * Diseño compacto que sobrescribe los estilos globales de accesibilidad
 */
export const AIProviderToggle: React.FC<AIProviderToggleProps> = ({ 
  className = '' 
}) => {
  const { aiProvider, toggleAIProvider } = useChatStore()
  const isGemini = aiProvider === 'gemini'

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Etiqueta del estado actual */}
      <span className="text-[11px] text-white/90 font-medium whitespace-nowrap select-none">
        {isGemini ? 'Gemini' : 'Básico'}
      </span>
      
      {/* Track del toggle - Material Design 3 style */}
      <button
        type="button"
        role="switch"
        aria-checked={isGemini}
        onClick={toggleAIProvider}
        aria-label={`Cambiar a modo ${isGemini ? 'básico' : 'Gemini'}`}
        style={{
          // Sobrescribir estilos globales de accesibilidad
          minHeight: '16px',
          minWidth: '32px',
          height: '16px',
          width: '32px',
          padding: 0,
          outline: 'none',
          boxShadow: 'none',
          border: 'none',
          borderRadius: '9999px',
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          cursor: 'pointer',
          transition: 'background-color 200ms ease-in-out',
          backgroundColor: isGemini ? 'rgba(103, 232, 249, 0.5)' : 'rgba(156, 163, 175, 0.4)',
        }}
      >
        {/* Thumb del toggle - Material Design 3 style */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            display: 'block',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: isGemini ? '#06b6d4' : '#d1d5db',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3)',
            transition: 'transform 200ms ease-in-out, background-color 200ms ease-in-out',
            transform: isGemini ? 'translateX(18px)' : 'translateX(2px)',
          }}
        />
      </button>
    </div>
  )
}
