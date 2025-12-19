/**
 * Utilidades de animación con Framer Motion
 * 
 * Este archivo contiene variantes de animación reutilizables y configuraciones
 * optimizadas para performance (usando transform y opacity).
 * 
 * Requisitos: 4.1
 */

import { Variants, Transition } from 'framer-motion'

/**
 * Transición suave por defecto
 * Optimizada para performance usando spring physics
 */
export const defaultTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
}

/**
 * Transición rápida para micro-interacciones
 */
export const quickTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 40,
}

/**
 * Transición suave para elementos grandes
 */
export const smoothTransition: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 25,
}

/**
 * Transición con easing para animaciones lineales
 */
export const easingTransition: Transition = {
  duration: 0.3,
  ease: [0.4, 0.0, 0.2, 1], // Material Design easing
}

/**
 * Variantes de fade in/out
 * Optimizado con opacity (no causa reflow)
 */
export const fadeVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: easingTransition,
  },
  exit: {
    opacity: 0,
    transition: easingTransition,
  },
}

/**
 * Variantes de slide desde abajo
 * Optimizado con transform (no causa reflow)
 */
export const slideUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: easingTransition,
  },
}

/**
 * Variantes de slide desde arriba
 */
export const slideDownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: easingTransition,
  },
}

/**
 * Variantes de slide desde la izquierda
 */
export const slideLeftVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: easingTransition,
  },
}

/**
 * Variantes de slide desde la derecha
 */
export const slideRightVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: easingTransition,
  },
}

/**
 * Variantes de scale (zoom)
 * Optimizado con transform scale
 */
export const scaleVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: easingTransition,
  },
}

/**
 * Variantes de scale con bounce
 * Para elementos que necesitan más énfasis
 */
export const scaleBounceVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 15,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: easingTransition,
  },
}

/**
 * Variantes para modales y overlays
 * Combina fade del backdrop con scale del contenido
 */
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
}

export const modalContentVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
}

/**
 * Variantes para dropdowns y menús
 */
export const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.15,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: {
      duration: 0.1,
      ease: 'easeIn',
    },
  },
}

/**
 * Variantes para listas con stagger
 * Los items aparecen uno tras otro
 */
export const listContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
}

export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: quickTransition,
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: {
      duration: 0.1,
    },
  },
}

/**
 * Variantes para cards en grid
 * Similar a lista pero con menos delay
 */
export const gridContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
}

export const gridItemVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: quickTransition,
  },
}

/**
 * Variantes para notificaciones/toasts
 * Entran desde la derecha
 */
export const toastVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 100,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    x: 100,
    scale: 0.8,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
}

/**
 * Variantes para transiciones de página
 * Fade suave entre páginas
 */
export const pageVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeInOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
}

/**
 * Variantes para transiciones de página con slide
 * Más dinámico que el fade simple
 */
export const pageSlideVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
}

/**
 * Micro-interacciones: Hover scale
 * Para botones y elementos interactivos
 */
export const hoverScaleVariants: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
    transition: quickTransition,
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
    },
  },
}

/**
 * Micro-interacciones: Hover lift
 * Para cards y elementos que se "levantan"
 */
export const hoverLiftVariants: Variants = {
  rest: {
    y: 0,
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  },
  hover: {
    y: -4,
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    transition: quickTransition,
  },
}

/**
 * Micro-interacciones: Pulse
 * Para elementos que necesitan llamar la atención
 */
export const pulseVariants: Variants = {
  rest: {
    scale: 1,
  },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatDelay: 2,
    },
  },
}

/**
 * Micro-interacciones: Shake
 * Para errores o validaciones
 */
export const shakeVariants: Variants = {
  rest: {
    x: 0,
  },
  shake: {
    x: [-10, 10, -10, 10, 0],
    transition: {
      duration: 0.4,
    },
  },
}

/**
 * Animación de skeleton loading
 * Shimmer effect
 */
export const shimmerVariants: Variants = {
  initial: {
    backgroundPosition: '-200% 0',
  },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
}

/**
 * Configuración de reducción de movimiento
 * Respeta la preferencia del usuario (prefers-reduced-motion)
 */
export const getReducedMotionConfig = () => {
  if (typeof window === 'undefined') return false
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Wrapper para aplicar reducción de movimiento
 * Si el usuario prefiere menos movimiento, simplifica las animaciones
 */
export const withReducedMotion = (variants: Variants): Variants => {
  if (getReducedMotionConfig()) {
    // Simplificar animaciones a solo fade
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.15 } },
      exit: { opacity: 0, transition: { duration: 0.1 } },
    }
  }
  
  return variants
}

/**
 * Hook para detectar cambios en prefers-reduced-motion
 */
export const useReducedMotion = () => {
  if (typeof window === 'undefined') return false
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  return mediaQuery.matches
}
