'use client'

import { useMemo, type ElementType, type FC } from 'react'
import { sanitizeHtml, sanitizeMarkdown, sanitizeStrict } from '@/shared/lib/xss-security'

type SanitizeMode = 'default' | 'strict' | 'markdown'

interface SafeHtmlProps {
  /** HTML a renderizar (será sanitizado automáticamente) */
  html: string
  /** Modo de sanitización */
  mode?: SanitizeMode
  /** Tag HTML a usar como contenedor */
  as?: ElementType
  /** Clases CSS adicionales */
  className?: string
  /** Props adicionales para el elemento contenedor */
  [key: string]: unknown
}

/**
 * SafeHtml Component
 * 
 * Componente seguro para renderizar HTML dinámico.
 * Sanitiza automáticamente el contenido usando DOMPurify para prevenir XSS.
 * 
 * USAR ESTE COMPONENTE EN LUGAR DE dangerouslySetInnerHTML
 * 
 * Modos de sanitización:
 * - 'default': Permite tags de formato básico (p, strong, em, ul, li, etc.)
 * - 'strict': Elimina TODO el HTML, solo devuelve texto plano
 * - 'markdown': Permite tags de markdown renderizado incluyendo links
 * 
 * Requisitos: 20.1 - Seguridad de autenticación y protección de datos
 * 
 * @example
 * // Renderizar HTML de usuario de forma segura
 * <SafeHtml html={userContent} mode="default" />
 * 
 * @example
 * // Renderizar markdown convertido a HTML
 * <SafeHtml html={markdownHtml} mode="markdown" className="prose" />
 * 
 * @example
 * // Mostrar texto plano (elimina todo HTML)
 * <SafeHtml html={untrustedContent} mode="strict" as="p" />
 */
export const SafeHtml: FC<SafeHtmlProps> = ({
  html,
  mode = 'default',
  as: Component = 'div',
  className,
  ...props
}) => {
  // Sanitizar el HTML según el modo seleccionado
  const sanitizedHtml = useMemo(() => {
    if (!html || typeof html !== 'string') {
      return ''
    }

    switch (mode) {
      case 'strict':
        return sanitizeStrict(html)
      case 'markdown':
        return sanitizeMarkdown(html)
      case 'default':
      default:
        return sanitizeHtml(html)
    }
  }, [html, mode])

  // Si el modo es strict, renderizar como texto plano
  if (mode === 'strict') {
    return (
      <Component className={className} {...props}>
        {sanitizedHtml}
      </Component>
    )
  }

  // Para otros modos, usar dangerouslySetInnerHTML con HTML sanitizado
  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      {...props}
    />
  )
}

export default SafeHtml
