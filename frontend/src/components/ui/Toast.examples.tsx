/**
 * Ejemplos de uso del Sistema de Notificaciones Toast
 * 
 * Este archivo contiene ejemplos prácticos de cómo usar el sistema de notificaciones
 * en diferentes escenarios comunes de la aplicación.
 */

'use client'

import React, { useState } from 'react'
import { useToast } from '@/hooks/useToast'
import { Button } from './Button'
import { Card, CardHeader, CardTitle, CardContent } from './Card'

/**
 * Ejemplo 1: Notificaciones Básicas
 * Muestra los 4 tipos de notificaciones con mensajes simples
 */
export function BasicToastExample() {
  const toast = useToast()
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificaciones Básicas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            onClick={() => toast.success('¡Operación completada exitosamente!')}
          >
            Mostrar Éxito
          </Button>
          
          <Button
            variant="danger"
            onClick={() => toast.error('Ocurrió un error al procesar la solicitud')}
          >
            Mostrar Error
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => toast.warning('Esta acción no se puede deshacer')}
          >
            Mostrar Advertencia
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => toast.info('Nueva actualización disponible')}
          >
            Mostrar Info
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Ejemplo 2: Notificaciones con Títulos Personalizados
 * Muestra cómo agregar títulos personalizados a las notificaciones
 */
export function ToastWithTitlesExample() {
  const toast = useToast()
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificaciones con Títulos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            onClick={() => toast.success(
              'Tu pedido #12345 ha sido confirmado',
              'Pedido Confirmado'
            )}
          >
            Pedido Confirmado
          </Button>
          
          <Button
            variant="danger"
            onClick={() => toast.error(
              'No se pudo procesar el pago. Verifica tu tarjeta.',
              'Error de Pago'
            )}
          >
            Error de Pago
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => toast.warning(
              'Solo quedan 3 unidades en stock',
              'Stock Limitado'
            )}
          >
            Stock Limitado
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Ejemplo 3: Notificaciones con Duración Personalizada
 * Muestra cómo controlar cuánto tiempo se muestra cada notificación
 */
export function ToastWithDurationExample() {
  const toast = useToast()
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Duración Personalizada</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            onClick={() => toast.success(
              'Notificación rápida (2 segundos)',
              'Rápida',
              2000
            )}
          >
            2 Segundos
          </Button>
          
          <Button
            variant="primary"
            onClick={() => toast.success(
              'Notificación normal (5 segundos)',
              'Normal',
              5000
            )}
          >
            5 Segundos
          </Button>
          
          <Button
            variant="primary"
            onClick={() => toast.success(
              'Notificación larga (10 segundos)',
              'Larga',
              10000
            )}
          >
            10 Segundos
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => toast.info(
              'Esta notificación no se cierra automáticamente',
              'Sin Auto-Close',
              0
            )}
          >
            Sin Auto-Close
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Ejemplo 4: Notificaciones con Acciones
 * Muestra cómo agregar botones de acción a las notificaciones
 */
export function ToastWithActionsExample() {
  const toast = useToast()
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificaciones con Acciones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={() => {
                toast.show({
                  type: 'success',
                  title: 'Producto agregado',
                  message: 'Laptop HP agregada al carrito',
                  duration: 7000,
                  action: {
                    label: 'Ver carrito',
                    onClick: () => {
                      console.log('Navegando al carrito...')
                      toast.info('Navegando al carrito')
                    }
                  }
                })
              }}
            >
              Agregar al Carrito
            </Button>
            
            <Button
              variant="danger"
              onClick={() => {
                toast.show({
                  type: 'error',
                  title: 'Error de conexión',
                  message: 'No se pudo conectar al servidor',
                  duration: 0,
                  action: {
                    label: 'Reintentar',
                    onClick: () => {
                      console.log('Reintentando conexión...')
                      toast.info('Reintentando conexión...')
                    }
                  }
                })
              }}
            >
              Simular Error
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => {
                toast.show({
                  type: 'info',
                  title: 'Nueva versión disponible',
                  message: 'Hay una actualización disponible para la aplicación',
                  duration: 0,
                  action: {
                    label: 'Actualizar',
                    onClick: () => {
                      console.log('Actualizando aplicación...')
                      toast.success('Aplicación actualizada')
                    }
                  }
                })
              }}
            >
              Actualización Disponible
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Ejemplo 5: Múltiples Notificaciones
 * Demuestra el sistema de cola (máximo 3 visibles)
 */
export function MultipleToastsExample() {
  const toast = useToast()
  
  const showMultiple = () => {
    toast.success('Primera notificación')
    setTimeout(() => toast.info('Segunda notificación'), 200)
    setTimeout(() => toast.warning('Tercera notificación'), 400)
    setTimeout(() => toast.error('Cuarta notificación (reemplaza la primera)'), 600)
    setTimeout(() => toast.success('Quinta notificación'), 800)
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Múltiples Notificaciones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button
            variant="primary"
            onClick={showMultiple}
          >
            Mostrar 5 Notificaciones
          </Button>
          
          <p className="text-sm text-gray-600">
            El sistema muestra máximo 3 notificaciones a la vez. 
            Las nuevas reemplazan a las más antiguas.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Ejemplo 6: Control Manual de Notificaciones
 * Muestra cómo cerrar notificaciones manualmente
 */
export function ManualControlExample() {
  const toast = useToast()
  const [notificationId, setNotificationId] = useState<string | null>(null)
  
  const showPersistent = () => {
    const id = toast.info(
      'Esta notificación no se cierra automáticamente',
      'Notificación Persistente',
      0
    )
    setNotificationId(id)
  }
  
  const dismissNotification = () => {
    if (notificationId) {
      toast.dismiss(notificationId)
      setNotificationId(null)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Control Manual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            onClick={showPersistent}
            disabled={!!notificationId}
          >
            Mostrar Persistente
          </Button>
          
          <Button
            variant="secondary"
            onClick={dismissNotification}
            disabled={!notificationId}
          >
            Cerrar Específica
          </Button>
          
          <Button
            variant="danger"
            onClick={() => toast.dismissAll()}
          >
            Cerrar Todas
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Ejemplo 7: Casos de Uso Reales
 * Simula escenarios reales de la aplicación
 */
export function RealWorldExamplesDemo() {
  const toast = useToast()
  
  // Simular agregar al carrito
  const handleAddToCart = () => {
    toast.success(
      'Laptop HP Pavilion agregada al carrito',
      'Producto agregado',
      3000
    )
  }
  
  // Simular login exitoso
  const handleLogin = () => {
    toast.success(
      'Bienvenido de nuevo, Juan',
      'Sesión iniciada',
      4000
    )
  }
  
  // Simular error de pago
  const handlePaymentError = () => {
    toast.error(
      'La tarjeta fue rechazada. Verifica los datos e intenta nuevamente.',
      'Error de Pago',
      7000
    )
  }
  
  // Simular stock bajo
  const handleLowStock = () => {
    toast.warning(
      'Solo quedan 2 unidades disponibles. ¡Compra ahora!',
      'Stock Limitado',
      6000
    )
  }
  
  // Simular pedido confirmado con acción
  const handleOrderConfirmed = () => {
    toast.show({
      type: 'success',
      title: '¡Pedido Confirmado!',
      message: 'Tu pedido #12345 ha sido procesado correctamente',
      duration: 10000,
      action: {
        label: 'Ver detalles',
        onClick: () => {
          console.log('Navegando a detalles del pedido...')
          toast.info('Abriendo detalles del pedido')
        }
      }
    })
  }
  
  // Simular actualización de perfil
  const handleProfileUpdate = () => {
    toast.success(
      'Tus cambios han sido guardados',
      'Perfil actualizado',
      3000
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Casos de Uso Reales</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button variant="primary" onClick={handleAddToCart}>
            Agregar al Carrito
          </Button>
          
          <Button variant="primary" onClick={handleLogin}>
            Iniciar Sesión
          </Button>
          
          <Button variant="danger" onClick={handlePaymentError}>
            Error de Pago
          </Button>
          
          <Button variant="secondary" onClick={handleLowStock}>
            Stock Bajo
          </Button>
          
          <Button variant="primary" onClick={handleOrderConfirmed}>
            Confirmar Pedido
          </Button>
          
          <Button variant="primary" onClick={handleProfileUpdate}>
            Actualizar Perfil
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Página de Demostración Completa
 * Muestra todos los ejemplos en una sola página
 */
export function ToastExamplesPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sistema de Notificaciones Toast
        </h1>
        <p className="text-gray-600">
          Ejemplos interactivos del sistema de notificaciones
        </p>
      </div>
      
      <BasicToastExample />
      <ToastWithTitlesExample />
      <ToastWithDurationExample />
      <ToastWithActionsExample />
      <MultipleToastsExample />
      <ManualControlExample />
      <RealWorldExamplesDemo />
    </div>
  )
}
