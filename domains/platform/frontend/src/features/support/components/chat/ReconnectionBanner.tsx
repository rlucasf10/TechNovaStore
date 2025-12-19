'use client'

import React, { useEffect, useState } from 'react'
import { ConnectionStatus } from '@/support/store/chat.store'

interface ReconnectionBannerProps {
  status: ConnectionStatus
  className?: string
}

/**
 * ReconnectionBanner Component
 * 
 * Banner que aparece cuando se pierde la conexión y muestra el progreso de reconexión
 * Se oculta automáticamente cuando se reconecta
 * 
 * Requisitos: 2.1
 */
export const ReconnectionBanner: React.FC<ReconnectionBannerProps> = ({ 
  status,
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [reconnectAttempt, setReconnectAttempt] = useState(0)

  useEffect(() => {
    if (status === 'reconnecting' || status === 'disconnected') {
      setIsVisible(true)
      if (status === 'reconnecting') {
        setReconnectAttempt(prev => prev + 1)
      }
    } else if (status === 'connected') {
      // Delay hiding to show success message briefly
      const timer = setTimeout(() => {
        setIsVisible(false)
        setReconnectAttempt(0)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [status])

  if (!isVisible) return null

  const getBannerConfig = () => {
    switch (status) {
      case 'connected':
        return {
          bgColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600',
          message: '¡Reconectado exitosamente!',
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )
        }
      case 'reconnecting':
        return {
          bgColor: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          message: `Reconectando${reconnectAttempt > 0 ? ` (intento ${reconnectAttempt})` : ''}...`,
          icon: (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )
        }
      case 'disconnected':
        return {
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          message: 'Conexión perdida. Intentando reconectar...',
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )
        }
    }
  }

  const config = getBannerConfig()

  return (
    <div 
      className={`
        ${config.bgColor} 
        border-l-4 
        ${config.textColor}
        p-3 
        mb-3 
        rounded-r-lg 
        shadow-sm
        animate-slide-down
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center space-x-3">
        <div className={config.iconColor}>
          {config.icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {config.message}
          </p>
          {status === 'reconnecting' && (
            <p className="text-xs mt-1 opacity-75">
              No es necesario recargar la página. La reconexión es automática.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
