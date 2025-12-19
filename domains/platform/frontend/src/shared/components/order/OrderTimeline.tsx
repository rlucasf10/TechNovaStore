/**
 * Componente OrderTimeline
 * 
 * Timeline vertical que muestra el estado del pedido con iconos y animaciones.
 * Estados: Confirmado, Procesando, Enviado, En reparto, Entregado
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'

export interface TimelineStep {
  id: string
  label: string
  description?: string
  status: 'completed' | 'current' | 'pending'
  timestamp?: string
  icon?: React.ReactNode
}

export interface OrderTimelineProps {
  steps: TimelineStep[]
  className?: string
}

// Iconos por defecto para cada tipo de estado
const defaultIcons = {
  confirmed: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  processing: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  shipped: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
  delivery: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  ),
  delivered: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ steps, className = '' }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    
    try {
      return new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(dateString))
    } catch {
      return dateString
    }
  }

  const getStepIcon = (step: TimelineStep, index: number) => {
    if (step.icon) return step.icon
    
    // Asignar icono por defecto según el índice
    const iconKeys = Object.keys(defaultIcons) as Array<keyof typeof defaultIcons>
    const iconKey = iconKeys[Math.min(index, iconKeys.length - 1)]
    return defaultIcons[iconKey]
  }

  return (
    <div className={`relative ${className}`}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        const isCompleted = step.status === 'completed'
        const isCurrent = step.status === 'current'

        return (
          <div key={step.id} className="relative pb-8 last:pb-0">
            {/* Línea vertical conectora */}
            {!isLast && (
              <div
                className={`absolute left-4 top-8 w-0.5 h-full -ml-px transition-colors duration-500 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}

            {/* Contenido del paso */}
            <div className="relative flex items-start group">
              {/* Círculo con icono */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="relative"
              >
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    transition-all duration-500 ease-in-out
                    ${
                      isCompleted
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/50'
                        : isCurrent
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50 ring-4 ring-blue-100'
                        : 'bg-gray-200 text-gray-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      {getStepIcon(step, index)}
                    </motion.div>
                  ) : isCurrent ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      {getStepIcon(step, index)}
                    </motion.div>
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                  )}
                </div>

                {/* Pulso animado para el paso actual */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-blue-400"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>

              {/* Información del paso */}
              <motion.div
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 + 0.1 }}
                className="ml-4 flex-1 min-w-0"
              >
                <div className="flex items-center justify-between">
                  <p
                    className={`
                      text-sm font-medium transition-colors duration-300
                      ${
                        isCompleted
                          ? 'text-gray-900'
                          : isCurrent
                          ? 'text-blue-600'
                          : 'text-gray-500'
                      }
                    `}
                  >
                    {step.label}
                  </p>
                  
                  {step.timestamp && (
                    <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                      {formatDate(step.timestamp)}
                    </span>
                  )}
                </div>

                {step.description && (
                  <p
                    className={`
                      text-sm mt-1 transition-colors duration-300
                      ${
                        isCompleted || isCurrent
                          ? 'text-gray-600'
                          : 'text-gray-400'
                      }
                    `}
                  >
                    {step.description}
                  </p>
                )}

                {/* Badge de estado actual */}
                {isCurrent && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                  >
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1.5"
                    />
                    En progreso
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Función helper para crear pasos del timeline desde el estado del pedido
export const createTimelineFromOrderStatus = (
  orderStatus: string,
  createdAt: string,
  updatedAt?: string
): TimelineStep[] => {
  const statusMap: Record<string, number> = {
    pending: 0,
    payment_confirmed: 1,
    processing: 2,
    shipped: 3,
    out_for_delivery: 4,
    delivered: 5,
    cancelled: -1,
    refunded: -1,
  }

  const currentStatusIndex = statusMap[orderStatus] ?? 0

  const steps: TimelineStep[] = [
    {
      id: 'confirmed',
      label: 'Pedido Confirmado',
      description: 'Tu pedido ha sido recibido y confirmado',
      status: currentStatusIndex >= 0 ? 'completed' : 'pending',
      timestamp: createdAt,
    },
    {
      id: 'processing',
      label: 'Procesando',
      description: 'Estamos preparando tu pedido',
      status:
        currentStatusIndex > 2
          ? 'completed'
          : currentStatusIndex === 2
          ? 'current'
          : 'pending',
      timestamp: currentStatusIndex >= 2 ? updatedAt : undefined,
    },
    {
      id: 'shipped',
      label: 'Enviado',
      description: 'Tu pedido está en camino',
      status:
        currentStatusIndex > 3
          ? 'completed'
          : currentStatusIndex === 3
          ? 'current'
          : 'pending',
      timestamp: currentStatusIndex >= 3 ? updatedAt : undefined,
    },
    {
      id: 'out_for_delivery',
      label: 'En Reparto',
      description: 'Tu pedido está siendo entregado',
      status:
        currentStatusIndex > 4
          ? 'completed'
          : currentStatusIndex === 4
          ? 'current'
          : 'pending',
      timestamp: currentStatusIndex >= 4 ? updatedAt : undefined,
    },
    {
      id: 'delivered',
      label: 'Entregado',
      description: 'Tu pedido ha sido entregado exitosamente',
      status: currentStatusIndex >= 5 ? 'completed' : 'pending',
      timestamp: currentStatusIndex >= 5 ? updatedAt : undefined,
    },
  ]

  // Si el pedido está cancelado o reembolsado, mostrar solo el primer paso y el estado final
  if (orderStatus === 'cancelled' || orderStatus === 'refunded') {
    return [
      steps[0],
      {
        id: orderStatus,
        label: orderStatus === 'cancelled' ? 'Cancelado' : 'Reembolsado',
        description:
          orderStatus === 'cancelled'
            ? 'El pedido ha sido cancelado'
            : 'El pedido ha sido reembolsado',
        status: 'completed',
        timestamp: updatedAt,
      },
    ]
  }

  return steps
}

export default OrderTimeline
