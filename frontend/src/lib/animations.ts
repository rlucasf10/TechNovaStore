/**
 * Configuraciones de animaciones con Framer Motion
 * 
 * Variantes y configuraciones reutilizables para animaciones
 */

import { Variants, Transition } from 'framer-motion';

/**
 * Transiciones por defecto
 */
export const transitions = {
  // Transición suave estándar
  smooth: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  } as Transition,
  
  // Transición rápida
  fast: {
    type: 'spring',
    stiffness: 400,
    damping: 40,
  } as Transition,
  
  // Transición lenta
  slow: {
    type: 'spring',
    stiffness: 200,
    damping: 25,
  } as Transition,
  
  // Transición con bounce
  bounce: {
    type: 'spring',
    stiffness: 500,
    damping: 15,
  } as Transition,
  
  // Transición lineal
  linear: {
    duration: 0.3,
    ease: 'linear',
  } as Transition,
  
  // Transición ease-in-out
  easeInOut: {
    duration: 0.3,
    ease: 'easeInOut',
  } as Transition,
};

/**
 * Variantes de Fade In/Out
 */
export const fadeVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: transitions.smooth,
  },
  exit: {
    opacity: 0,
    transition: transitions.fast,
  },
};

/**
 * Variantes de Slide In/Out (desde abajo)
 */
export const slideUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.smooth,
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: transitions.fast,
  },
};

/**
 * Variantes de Slide In/Out (desde arriba)
 */
export const slideDownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.smooth,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: transitions.fast,
  },
};

/**
 * Variantes de Slide In/Out (desde la izquierda)
 */
export const slideLeftVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.smooth,
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: transitions.fast,
  },
};

/**
 * Variantes de Slide In/Out (desde la derecha)
 */
export const slideRightVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.smooth,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: transitions.fast,
  },
};

/**
 * Variantes de Scale In/Out
 */
export const scaleVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.smooth,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: transitions.fast,
  },
};

/**
 * Variantes de Scale con Bounce
 */
export const scaleBounceVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.bounce,
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: transitions.fast,
  },
};

/**
 * Variantes para Modal/Overlay
 */
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transitions.smooth,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: transitions.fast,
  },
};

/**
 * Variantes para Backdrop/Overlay
 */
export const backdropVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: transitions.easeInOut,
  },
  exit: {
    opacity: 0,
    transition: transitions.easeInOut,
  },
};

/**
 * Variantes para Sidebar (desde la izquierda)
 */
export const sidebarVariants: Variants = {
  hidden: {
    x: '-100%',
  },
  visible: {
    x: 0,
    transition: transitions.smooth,
  },
  exit: {
    x: '-100%',
    transition: transitions.smooth,
  },
};

/**
 * Variantes para Dropdown
 */
export const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: transitions.fast,
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: transitions.fast,
  },
};

/**
 * Variantes para Toast/Notification
 */
export const toastVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -50,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: transitions.bounce,
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: transitions.fast,
  },
};

/**
 * Variantes para lista con stagger (animación escalonada)
 */
export const listContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.smooth,
  },
};

/**
 * Variantes para Skeleton Loader (shimmer effect)
 */
export const shimmerVariants: Variants = {
  initial: {
    backgroundPosition: '-200% 0',
  },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      duration: 1.5,
      ease: 'linear',
      repeat: Infinity,
    },
  },
};

/**
 * Variantes para Pulse (latido)
 */
export const pulseVariants: Variants = {
  initial: {
    scale: 1,
  },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};

/**
 * Variantes para Spin (rotación)
 */
export const spinVariants: Variants = {
  initial: {
    rotate: 0,
  },
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      ease: 'linear',
      repeat: Infinity,
    },
  },
};

/**
 * Variantes para Bounce (rebote)
 */
export const bounceVariants: Variants = {
  initial: {
    y: 0,
  },
  animate: {
    y: [-10, 0, -10],
    transition: {
      duration: 1,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};

/**
 * Variantes para Shake (sacudida)
 */
export const shakeVariants: Variants = {
  initial: {
    x: 0,
  },
  animate: {
    x: [-10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
    },
  },
};

/**
 * Variantes para Page Transition
 */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.smooth,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: transitions.fast,
  },
};

/**
 * Helper para crear variantes personalizadas de slide
 */
export const createSlideVariants = (
  direction: 'up' | 'down' | 'left' | 'right',
  distance: number = 20
): Variants => {
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
  const value = direction === 'down' || direction === 'right' ? distance : -distance;
  
  return {
    hidden: {
      opacity: 0,
      ...(axis === 'x' ? { x: value } : { y: value }),
    },
    visible: {
      opacity: 1,
      ...(axis === 'x' ? { x: 0 } : { y: 0 }),
      transition: transitions.smooth,
    },
    exit: {
      opacity: 0,
      ...(axis === 'x' ? { x: value } : { y: value }),
      transition: transitions.fast,
    },
  };
};

/**
 * Helper para crear variantes personalizadas de scale
 */
export const createScaleVariants = (
  initialScale: number = 0.95,
  withBounce: boolean = false
): Variants => {
  return {
    hidden: {
      opacity: 0,
      scale: initialScale,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: withBounce ? transitions.bounce : transitions.smooth,
    },
    exit: {
      opacity: 0,
      scale: initialScale,
      transition: transitions.fast,
    },
  };
};
