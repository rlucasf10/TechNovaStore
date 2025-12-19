'use client'

import React, { useMemo } from 'react'
import { sanitizeMarkdown, escapeHtml } from '@/shared/lib/xss-security'

interface StreamingTextProps {
  text: string
  isStreaming?: boolean
  className?: string
}

/**
 * StreamingText Component
 * 
 * Muestra texto con formato markdown y un cursor parpadeante cuando está en modo streaming
 * Soporta: negritas, cursivas, listas, saltos de línea
 * 
 * SEGURIDAD XSS:
 * - Usa DOMPurify para sanitizar el HTML generado
 * - Escapa caracteres HTML peligrosos antes de procesar markdown
 * - Solo permite tags de formato seguros (strong, em, ul, li, p, br)
 * 
 * Requisitos: 2.2, 20.1
 */
export const StreamingText: React.FC<StreamingTextProps> = ({ 
  text, 
  isStreaming = false,
  className = '' 
}) => {
  // Función para convertir markdown básico a HTML de forma segura
  const formatMarkdown = (content: string): string => {
    // Primero escapar TODO el HTML del contenido original
    // Esto previene inyección de HTML malicioso
    let formatted = escapeHtml(content)
    
    // Negritas: **texto** o __texto__
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    formatted = formatted.replace(/__(.+?)__/g, '<strong class="font-semibold">$1</strong>')
    
    // Cursivas: *texto* o _texto_ (pero no dentro de palabras)
    formatted = formatted.replace(/(?<!\w)\*([^*]+)\*(?!\w)/g, '<em class="italic">$1</em>')
    formatted = formatted.replace(/(?<!\w)_([^_]+)_(?!\w)/g, '<em class="italic text-gray-600">$1</em>')
    
    // Listas con viñetas: * item o - item
    formatted = formatted.replace(/^[\*\-]\s+(.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    
    // Envolver listas consecutivas en <ul>
    formatted = formatted.replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="my-2 space-y-1">$&</ul>')
    
    // Saltos de línea dobles = párrafos
    formatted = formatted.replace(/\n\n/g, '</p><p class="mt-2">')
    
    // Saltos de línea simples
    formatted = formatted.replace(/\n/g, '<br/>')
    
    // Envolver en párrafo si no empieza con uno
    if (!formatted.startsWith('<')) {
      formatted = `<p>${formatted}</p>`
    }
    
    // Sanitizar el HTML final con DOMPurify como capa adicional de seguridad
    return sanitizeMarkdown(formatted)
  }

  // Memoizar el HTML sanitizado para evitar re-procesamiento innecesario
  const sanitizedHtml = useMemo(() => formatMarkdown(text), [text])

  return (
    <span className={`markdown-content ${className}`}>
      <span 
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        className="[&>p]:leading-relaxed [&>ul]:list-inside [&>ul>li]:text-gray-700"
      />
      {isStreaming && (
        <span 
          className="inline-block w-0.5 h-4 bg-blue-600 ml-0.5 animate-pulse"
        >
          |
        </span>
      )}
    </span>
  )
}
