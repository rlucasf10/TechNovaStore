/**
 * Hook useFocusTrap
 * 
 * Atrapa el foco dentro de un contenedor (útil para modales y dropdowns).
 * Previene que el foco salga del contenedor al navegar con Tab.
 * 
 * Cumple con WCAG 2.1 AA - Criterio 2.1.2 (No Keyboard Trap)
 */

import { useEffect, RefObject } from 'react'

interface UseFocusTrapOptions {
  /** Ref del contenedor donde atrapar el foco */
  containerRef: RefObject<HTMLElement>
  /** Si el trap está activo */
  isActive: boolean
  /** Elemento inicial a enfocar (opcional) */
  initialFocusRef?: RefObject<HTMLElement>
  /** Callback cuando se presiona Escape */
  onEscape?: () => void
}

export function useFocusTrap({
  containerRef,
  isActive,
  initialFocusRef,
  onEscape,
}: UseFocusTrapOptions) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const previouslyFocusedElement = document.activeElement as HTMLElement

    // Enfocar el elemento inicial o el primer elemento enfocable
    const focusInitialElement = () => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus()
      } else {
        const firstFocusable = getFocusableElements(container)[0]
        firstFocusable?.focus()
      }
    }

    // Obtener todos los elementos enfocables dentro del contenedor
    const getFocusableElements = (element: HTMLElement): HTMLElement[] => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',')

      return Array.from(element.querySelectorAll<HTMLElement>(focusableSelectors))
        .filter((el) => {
          return (
            el.offsetWidth > 0 &&
            el.offsetHeight > 0 &&
            !el.hasAttribute('disabled') &&
            !el.getAttribute('aria-hidden')
          )
        })
    }

    // Manejar navegación con Tab
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault()
        onEscape()
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = getFocusableElements(container)
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        // Tab + Shift: navegar hacia atrás
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab: navegar hacia adelante
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    // Enfocar elemento inicial
    focusInitialElement()

    // Agregar listener
    container.addEventListener('keydown', handleKeyDown)

    // Cleanup: restaurar foco al elemento anterior
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      previouslyFocusedElement?.focus()
    }
  }, [isActive, containerRef, initialFocusRef, onEscape])
}
