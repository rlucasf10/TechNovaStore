/**
 * Hook useToast
 * 
 * Hook personalizado para mostrar notificaciones toast de forma sencilla.
 * Wrapper alrededor del store de notificaciones.
 * 
 * Uso:
 * ```tsx
 * const toast = useToast()
 * 
 * toast.success('Producto agregado al carrito')
 * toast.error('Error al procesar el pago')
 * toast.warning('Stock limitado')
 * toast.info('Nueva actualización disponible')
 * ```
 */

import { useNotificationStore } from '@/store/notification.store'

export function useToast() {
  const { success, error, warning, info, addNotification, removeNotification, clearAll } = useNotificationStore()
  
  return {
    /**
     * Muestra una notificación de éxito
     */
    success,
    
    /**
     * Muestra una notificación de error
     */
    error,
    
    /**
     * Muestra una notificación de advertencia
     */
    warning,
    
    /**
     * Muestra una notificación informativa
     */
    info,
    
    /**
     * Muestra una notificación personalizada
     */
    show: addNotification,
    
    /**
     * Cierra una notificación específica
     */
    dismiss: removeNotification,
    
    /**
     * Cierra todas las notificaciones
     */
    dismissAll: clearAll,
  }
}
