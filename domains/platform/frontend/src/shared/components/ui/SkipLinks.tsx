/**
 * Componente SkipLinks
 * 
 * Proporciona enlaces de navegación rápida para usuarios de teclado y lectores de pantalla.
 * Permite saltar directamente a secciones importantes de la página.
 * 
 * Cumple con WCAG 2.1 AA - Criterio 2.4.1 (Bypass Blocks)
 */

'use client'

import React from 'react'

interface SkipLink {
  href: string
  label: string
}

const defaultSkipLinks: SkipLink[] = [
  { href: '#main-content', label: 'Saltar al contenido principal' },
  { href: '#main-navigation', label: 'Saltar a la navegación' },
  { href: '#search', label: 'Saltar a la búsqueda' },
  { href: '#footer', label: 'Saltar al pie de página' },
]

interface SkipLinksProps {
  links?: SkipLink[]
}

export function SkipLinks({ links = defaultSkipLinks }: SkipLinksProps) {
  const handleSkipClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    
    const targetId = href.replace('#', '')
    const targetElement = document.getElementById(targetId)
    
    if (targetElement) {
      // Hacer el elemento enfocable temporalmente si no lo es
      const originalTabIndex = targetElement.getAttribute('tabindex')
      if (!originalTabIndex) {
        targetElement.setAttribute('tabindex', '-1')
      }
      
      // Enfocar el elemento
      targetElement.focus()
      
      // Scroll suave al elemento
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      
      // Restaurar tabindex original después de un momento
      if (!originalTabIndex) {
        setTimeout(() => {
          targetElement.removeAttribute('tabindex')
        }, 1000)
      }
    }
  }

  return (
    <div className="skip-links-container" role="navigation" aria-label="Enlaces de navegación rápida">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="skip-link"
          onClick={(e) => handleSkipClick(e, link.href)}
        >
          {link.label}
        </a>
      ))}
    </div>
  )
}
