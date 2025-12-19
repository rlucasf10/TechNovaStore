'use client'

/**
 * Componente PageTransition - Transiciones suaves entre páginas
 * 
 * Proporciona animaciones fluidas al navegar entre páginas usando Framer Motion.
 * Optimizado para performance usando transform y opacity.
 * 
 * Requisitos: 4.1
 */

import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { pageVariants, pageSlideVariants, withReducedMotion } from '@/lib/animations'

interface PageTransitionProps {
  /** Contenido de la página */
  children: ReactNode
  /** Clave única para la página (usualmente la ruta) */
  pageKey?: string
  /** Tipo de transición */
  variant?: 'fade' | 'slide'
  /** Clase CSS adicional */
  className?: string
}

/**
 * PageTransition - Wrapper para páginas con animaciones de transición
 * 
 * @example
 * ```tsx
 * // En un layout o página
 * <PageTransition pageKey={pathname} variant="fade">
 *   <YourPageContent />
 * </PageTransition>
 * ```
 * 
 * @example
 * ```tsx
 * // Con slide
 * <PageTransition pageKey={pathname} variant="slide">
 *   <YourPageContent />
 * </PageTransition>
 * ```
 */
export function PageTransition({
  children,
  pageKey,
  variant = 'fade',
  className,
}: PageTransitionProps) {
  // Seleccionar variantes según el tipo
  const variants = variant === 'slide' ? pageSlideVariants : pageVariants
  
  // Aplicar reducción de movimiento si está habilitada
  const finalVariants = withReducedMotion(variants)

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pageKey}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={finalVariants}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * SectionTransition - Transición para secciones dentro de una página
 * Útil para contenido que cambia dinámicamente
 * 
 * @example
 * ```tsx
 * <SectionTransition sectionKey={activeTab}>
 *   <TabContent />
 * </SectionTransition>
 * ```
 */
interface SectionTransitionProps {
  children: ReactNode
  sectionKey?: string
  className?: string
}

export function SectionTransition({
  children,
  sectionKey,
  className,
}: SectionTransitionProps) {
  const variants = withReducedMotion(pageVariants)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={sectionKey}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={variants}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
