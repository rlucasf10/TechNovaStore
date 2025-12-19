'use client'

import { 
  forwardRef, 
  ReactNode, 
  useEffect, 
  useRef, 
  useCallback,
  MouseEvent
} from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

/**
 * Tipos de animación disponibles para el modal
 */
export type AnimationType = 
  | 'fade'           // Fade in/out simple
  | 'scale'          // Escala desde el centro
  | 'slideUp'        // Desliza desde abajo
  | 'slideDown'      // Desliza desde arriba
  | 'slideLeft'      // Desliza desde la derecha
  | 'slideRight'     // Desliza desde la izquierda
  | 'flip'           // Efecto de volteo 3D
  | 'bounce'         // Rebote al entrar
  | 'rotate'         // Rotación al entrar

/**
 * Props del componente AnimatedModal
 */
interface AnimatedModalProps {
  /** Si el modal está abierto o cerrado */
  isOpen: boolean
  /** Función para cerrar el modal */
  onClose: () => void
  /** Contenido del modal */
  children: ReactNode
  /** Título del modal (opcional) */
  title?: ReactNode
  /** Descripción del modal (opcional) */
  description?: string
  /** Tipo de animación */
  animationType?: AnimationType
  /** Duración de la animación en segundos */
  duration?: number
  /** Si se puede cerrar haciendo clic fuera del modal */
  closeOnBackdropClick?: boolean
  /** Si se puede cerrar con la tecla ESC */
  closeOnEsc?: boolean
  /** Si se muestra el botón de cerrar */
  showCloseButton?: boolean
  /** Tamaño del modal */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Clases adicionales para el contenedor del modal */
  className?: string
  /** Clases adicionales para el overlay/backdrop */
  overlayClassName?: string
}

/**
 * Variantes de animación para cada tipo
 */
const animationVariants: Record<AnimationType, Variants> = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  },
  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  },
  slideUp: {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 }
  },
  slideDown: {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 }
  },
  slideLeft: {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 }
  },
  slideRight: {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  },
  flip: {
    hidden: { opacity: 0, rotateX: -90 },
    visible: { opacity: 1, rotateX: 0 },
    exit: { opacity: 0, rotateX: 90 }
  },
  bounce: {
    hidden: { opacity: 0, scale: 0.3 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 15
      }
    },
    exit: { opacity: 0, scale: 0.3 }
  },
  rotate: {
    hidden: { opacity: 0, rotate: -180, scale: 0.5 },
    visible: { opacity: 1, rotate: 0, scale: 1 },
    exit: { opacity: 0, rotate: 180, scale: 0.5 }
  }
}

/**
 * Variantes de animación para el backdrop
 */
const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
}

/**
 * Tamaños del modal
 */
const modalSizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4'
}

/**
 * AnimatedModal - Componente de modal con animaciones configurables
 * 
 * Este componente ofrece diferentes efectos de animación para entrada y salida del modal.
 * Incluye características de accesibilidad como trap de foco y cierre con ESC.
 * 
 * @example
 * ```tsx
 * <AnimatedModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Mi Modal"
 *   animationType="slideUp"
 * >
 *   <p>Contenido del modal</p>
 * </AnimatedModal>
 * ```
 */
export const AnimatedModal = forwardRef<HTMLDivElement, AnimatedModalProps>(
  (
    {
      isOpen,
      onClose,
      children,
      title,
      description,
      animationType = 'scale',
      duration = 0.3,
      closeOnBackdropClick = true,
      closeOnEsc = true,
      showCloseButton = true,
      size = 'md',
      className,
      overlayClassName,
    },
    _ref
  ) => {
    const modalRef = useRef<HTMLDivElement>(null)
    const previousActiveElement = useRef<HTMLElement | null>(null)

    // Manejar cierre con tecla ESC
    useEffect(() => {
      if (!closeOnEsc || !isOpen) return

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose()
        }
      }

      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [closeOnEsc, isOpen, onClose])

    // Trap de foco para accesibilidad
    useEffect(() => {
      if (!isOpen) return

      // Guardar el elemento activo antes de abrir el modal
      previousActiveElement.current = document.activeElement as HTMLElement

      // Enfocar el modal cuando se abre
      if (modalRef.current) {
        modalRef.current.focus()
      }

      // Restaurar el foco cuando se cierra
      return () => {
        if (previousActiveElement.current) {
          previousActiveElement.current.focus()
        }
      }
    }, [isOpen])

    // Prevenir scroll del body cuando el modal está abierto
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }

      return () => {
        document.body.style.overflow = ''
      }
    }, [isOpen])

    // Manejar clic en el backdrop
    const handleBackdropClick = useCallback(
      (event: MouseEvent<HTMLDivElement>) => {
        if (closeOnBackdropClick && event.target === event.currentTarget) {
          onClose()
        }
      },
      [closeOnBackdropClick, onClose]
    )

    // Obtener las variantes de animación
    const variants = animationVariants[animationType]

    return (
      <AnimatePresence mode="wait">
        {isOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-describedby={description ? 'modal-description' : undefined}
          >
            {/* Backdrop/Overlay */}
            <motion.div
              className={cn(
                'absolute inset-0 bg-black/50 backdrop-blur-sm',
                overlayClassName
              )}
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: duration * 0.8 }}
              onClick={handleBackdropClick}
            />

            {/* Modal Content */}
            <motion.div
              ref={modalRef}
              className={cn(
                'relative w-full bg-white rounded-lg shadow-xl',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                modalSizes[size],
                className
              )}
              variants={variants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration }}
              tabIndex={-1}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-start justify-between p-6 border-b border-gray-200">
                  <div className="flex-1">
                    {title && (
                      <h2
                        id="modal-title"
                        className="text-xl font-semibold text-gray-900"
                      >
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p
                        id="modal-description"
                        className="mt-1 text-sm text-gray-500"
                      >
                        {description}
                      </p>
                    )}
                  </div>

                  {showCloseButton && (
                    <button
                      type="button"
                      onClick={onClose}
                      className={cn(
                        'ml-4 rounded-lg p-1.5 text-gray-400',
                        'hover:bg-gray-100 hover:text-gray-600',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500',
                        'transition-colors'
                      )}
                      aria-label="Cerrar modal"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Body */}
              <div className="p-6">{children}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    )
  }
)

AnimatedModal.displayName = 'AnimatedModal'

export default AnimatedModal
