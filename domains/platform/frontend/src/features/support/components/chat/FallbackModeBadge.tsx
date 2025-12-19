'use client'

import React from 'react'

interface FallbackModeBadgeProps {
  className?: string
}

/**
 * FallbackModeBadge Component
 * 
 * Muestra un badge discreto cuando el chatbot está usando el modo de respaldo
 * (SimpleFallbackRecognizer en lugar de Ollama)
 * 
 * Requisitos: 2.3, 2.4
 */
export const FallbackModeBadge: React.FC<FallbackModeBadgeProps> = ({ 
  className = '' 
}) => {
  return (
    <div 
      className={`inline-flex items-center space-x-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded-md ${className}`}
      title="El chatbot está usando respuestas básicas porque el modelo de IA no está disponible"
    >
      <svg 
        className="w-3 h-3 text-amber-600" 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path 
          fillRule="evenodd" 
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
          clipRule="evenodd" 
        />
      </svg>
      <span className="text-xs font-medium text-amber-700">
        Modo Básico
      </span>
    </div>
  )
}
