/**
 * Hook useKeyboardNavigation
 * 
 * Proporciona funcionalidad de navegación por teclado para listas y menús.
 * Soporta navegación con flechas, Enter, Escape, Home, End.
 * 
 * Cumple con WCAG 2.1 AA - Criterio 2.1.1 (Keyboard)
 */

import { useState, useEffect, useCallback, RefObject } from 'react'

interface UseKeyboardNavigationOptions {
  /** Número total de items en la lista */
  itemCount: number
  /** Callback cuando se selecciona un item con Enter */
  onSelect?: (index: number) => void
  /** Callback cuando se presiona Escape */
  onEscape?: () => void
  /** Si la navegación debe ser circular (volver al inicio al llegar al final) */
  loop?: boolean
  /** Orientación de la navegación */
  orientation?: 'vertical' | 'horizontal'
  /** Ref del contenedor para scroll automático */
  containerRef?: RefObject<HTMLElement>
}

export function useKeyboardNavigation({
  itemCount,
  onSelect,
  onEscape,
  loop = true,
  orientation = 'vertical',
  containerRef,
}: UseKeyboardNavigationOptions) {
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const moveFocus = useCallback(
    (direction: 'next' | 'prev' | 'first' | 'last') => {
      setFocusedIndex((current) => {
        let next = current

        switch (direction) {
          case 'next':
            next = current + 1
            if (next >= itemCount) {
              next = loop ? 0 : itemCount - 1
            }
            break
          case 'prev':
            next = current - 1
            if (next < 0) {
              next = loop ? itemCount - 1 : 0
            }
            break
          case 'first':
            next = 0
            break
          case 'last':
            next = itemCount - 1
            break
        }

        return next
      })
    },
    [itemCount, loop]
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const isVertical = orientation === 'vertical'
      const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight'
      const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft'

      switch (event.key) {
        case nextKey:
          event.preventDefault()
          moveFocus('next')
          break
        case prevKey:
          event.preventDefault()
          moveFocus('prev')
          break
        case 'Home':
          event.preventDefault()
          moveFocus('first')
          break
        case 'End':
          event.preventDefault()
          moveFocus('last')
          break
        case 'Enter':
          event.preventDefault()
          if (focusedIndex >= 0 && onSelect) {
            onSelect(focusedIndex)
          }
          break
        case 'Escape':
          event.preventDefault()
          if (onEscape) {
            onEscape()
          }
          break
      }
    },
    [orientation, moveFocus, focusedIndex, onSelect, onEscape]
  )

  // Scroll automático al item enfocado
  useEffect(() => {
    if (containerRef?.current && focusedIndex >= 0) {
      const container = containerRef.current
      const focusedElement = container.children[focusedIndex] as HTMLElement

      if (focusedElement) {
        const containerRect = container.getBoundingClientRect()
        const elementRect = focusedElement.getBoundingClientRect()

        if (elementRect.bottom > containerRect.bottom) {
          focusedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        } else if (elementRect.top < containerRect.top) {
          focusedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }
      }
    }
  }, [focusedIndex, containerRef])

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    moveFocus,
  }
}
