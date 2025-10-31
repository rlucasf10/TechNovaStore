'use client'

import { 
  HTMLAttributes, 
  forwardRef, 
  ReactNode, 
  useEffect, 
  useRef, 
  useCallback,
  MouseEvent
} from 'react'
import { cn } from '@/lib/utils'

interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Controla si el modal está abierto o cerrado */
  open: boolean
  /** Callback cuando el modal se cierra */
  onClose: () => void
  /** Título del modal */
  title?: ReactNode
  /** Descripción o subtítulo del modal */
  description?: ReactNode
  /** Tamaño del modal */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Deshabilitar cierre al hacer clic fuera del modal */
  disableBackdropClick?: boolean
  /** Deshabilitar cierre con tecla ESC */
  disableEscapeKey?: boolean
  /** Mostrar botón de cerrar (X) en la esquina superior derecha */
  showCloseButton?: boolean
  /** Contenido del footer del modal */
  footer?: ReactNode
  /** Clase CSS personalizada para el contenedor del modal */
  containerClassName?: string
  /** Clase CSS personalizada para el overlay/backdrop */
  overlayClassName?: string
}

/**
 * Componente Modal - Ventana modal con overlay y animaciones
 * 
 * Características:
 * - Overlay con backdrop oscuro
 * - Animaciones de entrada/salida con Framer Motion
 * - Cierre con ESC y click fuera (configurable)
 * - Trap de foco para accesibilidad (WCAG 2.1)
 * - Bloqueo de scroll del body cuando está abierto
 * - Múltiples tamaños configurables
 * - Soporte para tema oscuro
 * 
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false)
 * 
 * <Modal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirmar acción"
 *   description="¿Estás seguro de que deseas continuar?"
 *   footer={
 *     <>
 *       <Button variant="ghost" onClick={() => setIsOpen(false)}>
 *         Cancelar
 *       </Button>
 *       <Button onClick={handleConfirm}>
 *         Confirmar
 *       </Button>
 *     </>
 *   }
 * >
 *   <p>Esta acción no se puede deshacer.</p>
 * </Modal>
 * ```
 * 
 * Requisitos: 5.2, 5.3
 */
const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ 
    open,
    onClose,
    title,
    description,
    size = 'md',
    disableBackdropClick = false,
    disableEscapeKey = false,
    showCloseButton = true,
    footer,
    children,
    className,
    containerClassName,
    overlayClassName,
    ...props 
  }, ref) => {
    const modalRef = useRef<HTMLDivElement>(null)
    const previousActiveElement = useRef<HTMLElement | null>(null)

    // Tamaños del modal
    const sizes = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-full mx-4',
    }

    // Manejar cierre con ESC
    const handleEscapeKey = useCallback((event: globalThis.KeyboardEvent) => {
      if (!disableEscapeKey && event.key === 'Escape' && open) {
        onClose()
      }
    }, [disableEscapeKey, open, onClose])

    // Manejar click en el backdrop
    const handleBackdropClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
      if (!disableBackdropClick && event.target === event.currentTarget) {
        onClose()
      }
    }, [disableBackdropClick, onClose])

    // Trap de foco - obtener elementos focuseables
    const getFocusableElements = useCallback(() => {
      if (!modalRef.current) return []
      
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ')

      return Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
      )
    }, [])

    // Trap de foco - manejar navegación con Tab
    const handleKeyDown = useCallback((event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Tab' || !open) return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      // Si Shift+Tab en el primer elemento, ir al último
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      }
      // Si Tab en el último elemento, ir al primero
      else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }, [open, getFocusableElements])

    // Efectos cuando el modal se abre/cierra
    useEffect(() => {
      if (open) {
        // Guardar el elemento activo actual
        previousActiveElement.current = document.activeElement as HTMLElement

        // Bloquear scroll del body
        document.body.style.overflow = 'hidden'

        // Agregar event listeners
        document.addEventListener('keydown', handleEscapeKey)
        document.addEventListener('keydown', handleKeyDown)

        // Enfocar el primer elemento focuseable después de un pequeño delay
        // para permitir que la animación se complete
        setTimeout(() => {
          const focusableElements = getFocusableElements()
          if (focusableElements.length > 0) {
            focusableElements[0].focus()
          } else if (modalRef.current) {
            modalRef.current.focus()
          }
        }, 100)
      } else {
        // Restaurar scroll del body
        document.body.style.overflow = ''

        // Remover event listeners
        document.removeEventListener('keydown', handleEscapeKey)
        document.removeEventListener('keydown', handleKeyDown)

        // Restaurar foco al elemento anterior
        if (previousActiveElement.current) {
          previousActiveElement.current.focus()
          previousActiveElement.current = null
        }
      }

      return () => {
        document.body.style.overflow = ''
        document.removeEventListener('keydown', handleEscapeKey)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }, [open, handleEscapeKey, handleKeyDown, getFocusableElements])

    // No renderizar nada si el modal está cerrado
    if (!open) return null

    return (
      <div
        ref={ref}
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center p-4',
          'animate-in fade-in duration-200',
          containerClassName
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
      >
        {/* Backdrop/Overlay */}
        <div
          className={cn(
            'absolute inset-0 bg-black/50 backdrop-blur-sm',
            'animate-in fade-in duration-200',
            overlayClassName
          )}
          onClick={handleBackdropClick}
          aria-hidden="true"
        />

        {/* Modal Content */}
        <div
          ref={modalRef}
          className={cn(
            'relative w-full bg-white dark:bg-dark-bg-secondary rounded-lg shadow-xl',
            'animate-in zoom-in-95 slide-in-from-bottom-4 duration-200',
            'max-h-[90vh] flex flex-col',
            sizes[size],
            className
          )}
          tabIndex={-1}
          {...props}
        >
          {/* Header */}
          {(title || description || showCloseButton) && (
            <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-dark-bg-tertiary">
              <div className="flex-1 pr-4">
                {title && (
                  <h2
                    id="modal-title"
                    className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id="modal-description"
                    className="mt-1 text-sm text-gray-500 dark:text-dark-text-secondary"
                  >
                    {description}
                  </p>
                )}
              </div>

              {/* Botón de cerrar */}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    'flex-shrink-0 rounded-md p-1 text-gray-400',
                    'hover:text-gray-500 hover:bg-gray-100',
                    'dark:hover:text-dark-text-primary dark:hover:bg-dark-bg-tertiary',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                    'transition-colors duration-200'
                  )}
                  aria-label="Cerrar modal"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-dark-bg-tertiary">
              {footer}
            </div>
          )}
        </div>
      </div>
    )
  }
)

Modal.displayName = 'Modal'

/**
 * ModalHeader - Componente de encabezado personalizado para el modal
 * Útil cuando necesitas más control sobre el header que las props title/description
 */
interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Agregar borde inferior */
  bordered?: boolean
}

const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, bordered = true, children, ...props }, ref) => {
    const borderClass = bordered
      ? 'border-b border-gray-200 dark:border-dark-bg-tertiary'
      : ''

    return (
      <div
        ref={ref}
        className={cn('p-6', borderClass, className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ModalHeader.displayName = 'ModalHeader'

/**
 * ModalBody - Componente de cuerpo personalizado para el modal
 * Útil para tener más control sobre el padding y scroll
 */
interface ModalBodyProps extends HTMLAttributes<HTMLDivElement> {
  /** Deshabilitar padding */
  noPadding?: boolean
}

const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className, noPadding = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex-1 overflow-y-auto',
          !noPadding && 'p-6',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ModalBody.displayName = 'ModalBody'

/**
 * ModalFooter - Componente de footer personalizado para el modal
 * Útil cuando necesitas más control sobre el footer que la prop footer
 */
interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Agregar borde superior */
  bordered?: boolean
  /** Alineación de los elementos */
  align?: 'left' | 'center' | 'right'
}

const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, bordered = true, align = 'right', children, ...props }, ref) => {
    const borderClass = bordered
      ? 'border-t border-gray-200 dark:border-dark-bg-tertiary'
      : ''

    const alignClasses = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3 p-6',
          borderClass,
          alignClasses[align],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ModalFooter.displayName = 'ModalFooter'

export { Modal, ModalHeader, ModalBody, ModalFooter }
export type { ModalProps, ModalHeaderProps, ModalBodyProps, ModalFooterProps }
