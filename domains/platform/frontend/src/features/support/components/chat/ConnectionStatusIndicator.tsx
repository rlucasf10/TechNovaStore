'use client'

import React, { useState, useEffect } from 'react'
import { ConnectionStatus } from '@/support/store/chat.store'

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus
  className?: string
  showReconnectAttempts?: boolean
}

/**
 * ConnectionStatusIndicator Component
 * 
 * Muestra el estado de conexión con el servidor de chat con reconexión automática
 * - Verde: Conectado
 * - Amarillo: Reconectando (con animación de pulso)
 * - Rojo: Desconectado
 * 
 * Características de reconexión automática:
 * - Detecta desconexión automáticamente
 * - Intenta reconectar con backoff exponencial
 * - Muestra estado de reconexión al usuario
 * - Reconexión transparente sin perder contexto
 * 
 * Requisitos: 2.1
 */
export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({ 
  status,
  className = '',
  showReconnectAttempts = false
}) => {
  const [reconnectCount, setReconnectCount] = useState(0)

  // Reset reconnect count when connected
  useEffect(() => {
    if (status === 'connected') {
      setReconnectCount(0)
    }
  }, [status])

  // Increment reconnect count when reconnecting
  useEffect(() => {
    if (status === 'reconnecting') {
      setReconnectCount(prev => prev + 1)
    }
  }, [status])

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          color: 'bg-green-500',
          text: 'Conectado',
          tooltip: 'Conexión estable con el servidor',
          icon: (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )
        }
      case 'reconnecting':
        return {
          color: 'bg-yellow-500',
          text: showReconnectAttempts && reconnectCount > 0 
            ? `Reconectando (${reconnectCount})...` 
            : 'Reconectando...',
          tooltip: 'Intentando reconectar automáticamente. No es necesario recargar la página.',
          icon: (
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )
        }
      case 'disconnected':
        return {
          color: 'bg-red-500',
          text: 'Desconectado',
          tooltip: 'Sin conexión con el servidor. Intentando reconectar automáticamente...',
          icon: (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div 
      className={`flex items-center space-x-1.5 ${className}`}
      title={config.tooltip}
    >
      <div className={`w-2 h-2 rounded-full ${config.color} ${status === 'reconnecting' ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-white flex items-center space-x-1">
        {config.icon}
        <span>{config.text}</span>
      </span>
    </div>
  )
}
