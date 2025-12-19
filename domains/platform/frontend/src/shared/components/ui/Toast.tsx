/**
 * Componente Toast para Notificaciones
 * 
 * Sistema de notificaciones tipo toast que muestra mensajes temporales
 * en la esquina de la pantalla.
 * 
 * Características:
 * - 4 tipos: success, error, warning, info
 * - Auto-close con barra de progreso
 * - Animaciones de entrada/salida
 * - Máximo 3 notificaciones visibles
 * - Acción opcional (botón)
 */

'use client'

import { useEffect, useState } from 'react'
import { useNotificationStore, type Notification } from '@/store/notification.store'

// Iconos para cada tipo de notificación
const icons = {
  success: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
}

// Estilos por tipo de notificación (ajustados para WCAG 2.1 AA)
const styles = {
  success: {
    container: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700',
    icon: 'text-success dark:text-green-400', // Usa color semántico ajustado (#047857)
    title: 'text-green-900 dark:text-green-100',
    message: 'text-success dark:text-green-300', // Usa color semántico ajustado para mejor contraste
    progress: 'bg-success',
    button: 'text-success dark:text-green-400 hover:text-green-900 dark:hover:text-green-200',
  },
  error: {
    container: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700',
    icon: 'text-error dark:text-red-400', // Usa color semántico ajustado (#dc2626)
    title: 'text-red-900 dark:text-red-100',
    message: 'text-error dark:text-red-300', // Usa color semántico ajustado para mejor contraste
    progress: 'bg-error',
    button: 'text-error dark:text-red-400 hover:text-red-900 dark:hover:text-red-200',
  },
  warning: {
    container: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700',
    icon: 'text-warning dark:text-yellow-400', // Usa color semántico ajustado (#b45309)
    title: 'text-yellow-900 dark:text-yellow-100',
    message: 'text-warning dark:text-yellow-300', // Usa color semántico ajustado para mejor contraste
    progress: 'bg-warning',
    button: 'text-warning dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-200',
  },
  info: {
    container: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700',
    icon: 'text-info dark:text-blue-400', // Usa color semántico (#3b82f6)
    title: 'text-blue-900 dark:text-blue-100',
    message: 'text-info dark:text-blue-300', // Usa color semántico para mejor contraste
    progress: 'bg-info',
    button: 'text-info dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200',
  },
}

interface ToastItemProps {
  notification: Notification
  onClose: (id: string) => void
}

function ToastItem({ notification, onClose }: ToastItemProps) {
  const [progress, setProgress] = useState(100)
  const [isExiting, setIsExiting] = useState(false)
  
  const style = styles[notification.type]
  const icon = icons[notification.type]
  
  useEffect(() => {
    if (!notification.duration || notification.duration === 0) return
    
    const startTime = Date.now()
    const duration = notification.duration
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      
      if (remaining === 0) {
        clearInterval(interval)
      }
    }, 50)
    
    return () => clearInterval(interval)
  }, [notification.duration])
  
  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose(notification.id)
    }, 300) // Duración de la animación de salida
  }
  
  return (
    <div
      className={`
        relative w-full max-w-sm rounded-lg border shadow-lg overflow-hidden
        transition-all duration-300 ease-in-out
        ${style.container}
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      aria-relevant="additions text"
    >
      {/* Contenido */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icono */}
          <div className={`flex-shrink-0 ${style.icon}`}>
            {icon}
          </div>
          
          {/* Texto */}
          <div className="flex-1 min-w-0">
            {notification.title && (
              <p className={`text-sm font-semibold ${style.title}`}>
                {notification.title}
              </p>
            )}
            <p className={`text-sm ${notification.title ? 'mt-1' : ''} ${style.message}`}>
              {notification.message}
            </p>
            
            {/* Acción opcional */}
            {notification.action && (
              <button
                onClick={notification.action.onClick}
                className={`mt-2 text-sm font-medium ${style.button} transition-colors`}
              >
                {notification.action.label}
              </button>
            )}
          </div>
          
          {/* Botón cerrar */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Cerrar notificación"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Barra de progreso */}
      {notification.duration && notification.duration > 0 && (
        <div className="h-1 bg-gray-200 dark:bg-slate-700">
          <div
            className={`h-full transition-all duration-50 ease-linear ${style.progress}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Contenedor de Toasts
 * 
 * Se posiciona en la esquina superior derecha y muestra
 * las notificaciones activas apiladas.
 */
export function ToastContainer() {
  const { notifications, removeNotification } = useNotificationStore()
  
  if (notifications.length === 0) return null
  
  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none"
      role="region"
      aria-label="Notificaciones"
      aria-live="polite"
      aria-atomic="false"
    >
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <ToastItem
            notification={notification}
            onClose={removeNotification}
          />
        </div>
      ))}
    </div>
  )
}
