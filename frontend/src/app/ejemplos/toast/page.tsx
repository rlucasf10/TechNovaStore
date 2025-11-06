/**
 * Página de Ejemplos del Sistema de Notificaciones Toast
 * 
 * Ruta: /ejemplos/toast
 * 
 * Esta página muestra ejemplos interactivos del sistema de notificaciones
 * para facilitar el desarrollo y testing.
 */

import { ToastExamplesPage } from '@/components/ui/Toast.examples'

export const metadata = {
  title: 'Ejemplos de Toast - TechNovaStore',
  description: 'Ejemplos interactivos del sistema de notificaciones Toast',
}

export default function ToastExamplesRoute() {
  return <ToastExamplesPage />
}
