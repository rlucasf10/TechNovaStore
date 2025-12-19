'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, Badge, Loading } from '@/ui'
import { orderService } from '@/shared/services/orderService'
import { shipmentService, TrackingInfo } from '@/shared/services/shipmentService'
import { OrderTimeline, createTimelineFromOrderStatus } from '@/shared/components/order'
import { useToast } from '@/shared/hooks/useToast'
import { formatPrice } from '@/lib/utils'
import { useAuthStore } from '@/features/customer/store/auth.store'

interface Order {
  id: number
  order_number: string
  status: string
  subtotal: number
  shipping_cost: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  items: OrderItem[]
  shipping_address: Address
  billing_address: Address
  payment_method: string
  created_at: string
  updated_at: string
}

interface OrderItem {
  id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  subtotal?: number // Alias para compatibilidad
}

interface Address {
  firstName: string
  lastName: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  payment_confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  payment_confirmed: 'Pago Confirmado',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const toast = useToast()
  const { isAuthenticated } = useAuthStore()
  
  const [order, setOrder] = useState<Order | null>(null)
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null)
  const [previousStatus, setPreviousStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Función para cargar información de seguimiento
  const fetchTrackingInfo = async (orderNumber: string) => {
    try {
      setTrackingLoading(true)
      const tracking = await shipmentService.getTrackingInfo(orderNumber)
      
      // Detectar cambio de estado y mostrar notificación
      if (trackingInfo && tracking.status !== trackingInfo.status) {
        const statusMessages: Record<string, { title: string; message: string }> = {
          label_created: {
            title: 'Etiqueta Creada',
            message: 'Se ha creado la etiqueta de envío para tu pedido'
          },
          picked_up: {
            title: 'Pedido Recogido',
            message: 'El transportista ha recogido tu pedido'
          },
          in_transit: {
            title: 'En Tránsito',
            message: 'Tu pedido está en camino'
          },
          out_for_delivery: {
            title: 'En Reparto',
            message: 'Tu pedido está siendo entregado hoy'
          },
          delivered: {
            title: '¡Entregado!',
            message: 'Tu pedido ha sido entregado exitosamente'
          },
          exception: {
            title: 'Incidencia en el Envío',
            message: 'Ha ocurrido una incidencia con tu envío. Contacta con soporte.'
          },
        }

        const statusInfo = statusMessages[tracking.status]
        if (statusInfo) {
          if (tracking.status === 'delivered') {
            toast.success(`${statusInfo.title}: ${statusInfo.message}`)
          } else if (tracking.status === 'exception') {
            toast.warning(`${statusInfo.title}: ${statusInfo.message}`)
          } else {
            toast.info(`${statusInfo.title}: ${statusInfo.message}`)
          }
        }
      }
      
      setTrackingInfo(tracking)
    } catch (err: any) {
      console.error('Error fetching tracking info:', err)
      // No mostrar error si no hay información de seguimiento disponible
      // Es normal que algunos pedidos no tengan tracking todavía
    } finally {
      setTrackingLoading(false)
    }
  }

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // ✅ SEGURIDAD: Verificar autenticación usando el store, no localStorage
        // La autenticación real se valida mediante httpOnly cookies en el backend
        if (!isAuthenticated) {
          console.log('User not authenticated, redirecting to login')
          router.push('/login')
          return
        }
        
        console.log('Fetching order:', orderId)
        const response = await orderService.getOrderById(orderId)
        console.log('Order response:', response)
        
        if (response.success && response.data) {
          // Detectar cambio de estado del pedido
          if (previousStatus && previousStatus !== response.data.status) {
            const orderStatusMessages: Record<string, { title: string; message: string }> = {
              payment_confirmed: {
                title: 'Pago Confirmado',
                message: 'Tu pago ha sido confirmado exitosamente'
              },
              processing: {
                title: 'Procesando Pedido',
                message: 'Estamos preparando tu pedido'
              },
              shipped: {
                title: 'Pedido Enviado',
                message: 'Tu pedido ha sido enviado'
              },
              delivered: {
                title: '¡Pedido Entregado!',
                message: 'Tu pedido ha sido entregado exitosamente'
              },
              cancelled: {
                title: 'Pedido Cancelado',
                message: 'Tu pedido ha sido cancelado'
              },
            }

            const statusInfo = orderStatusMessages[response.data.status]
            if (statusInfo) {
              if (response.data.status === 'delivered') {
                toast.success(`${statusInfo.title}: ${statusInfo.message}`)
              } else if (response.data.status === 'cancelled') {
                toast.error(`${statusInfo.title}: ${statusInfo.message}`)
              } else {
                toast.info(`${statusInfo.title}: ${statusInfo.message}`)
              }
            }
          }
          
          setPreviousStatus(response.data.status)
          setOrder(response.data)
          
          // Cargar información de seguimiento si el pedido está enviado
          if (['shipped', 'out_for_delivery', 'delivered'].includes(response.data.status)) {
            fetchTrackingInfo(response.data.order_number)
          }
        } else {
          setError(response.message || 'No se pudo cargar el pedido')
        }
      } catch (err: any) {
        console.error('Error fetching order:', err)
        // Si es error 401, redirigir a login
        if (err?.response?.status === 401) {
          router.push('/login')
          return
        }
        setError(err?.response?.data?.message || 'Error al cargar los detalles del pedido')
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchOrder()
    }
  }, [orderId, isAuthenticated, router])

  // Actualización automática cada 30 segundos si hay tracking activo
  useEffect(() => {
    if (!order || !trackingInfo) return
    
    // Solo actualizar si el pedido no está entregado o cancelado
    if (['delivered', 'cancelled', 'refunded'].includes(order.status)) return

    const interval = setInterval(() => {
      fetchTrackingInfo(order.order_number)
    }, 30000) // 30 segundos

    return () => clearInterval(interval)
  }, [order, trackingInfo])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loading size="lg" />
          <p className="mt-4 text-gray-600">Cargando detalles del pedido...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Pedido no encontrado
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'No pudimos encontrar el pedido solicitado'}
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push('/dashboard/usuario')}>
                Ver Mis Pedidos
              </Button>
              <Button variant="secondary" onClick={() => router.push('/')}>
                Ir al Inicio
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const estimatedDelivery = new Date(order.created_at)
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 7)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/dashboard/usuario" 
            className="text-primary-600 hover:text-primary-700 text-sm font-medium inline-flex items-center mb-4"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a Mis Pedidos
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Pedido {order.order_number}
              </h1>
              <p className="text-gray-600 mt-1">
                Realizado el {formatDate(order.created_at)}
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0">
              <Badge className={statusColors[order.status] || 'bg-gray-100 text-gray-800'}>
                {statusLabels[order.status] || order.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status Timeline */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Estado del Pedido
                </h2>
                
                {trackingLoading && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Loading size="sm" />
                    <span className="ml-2">Actualizando...</span>
                  </div>
                )}
              </div>
              
              {/* Timeline Component */}
              <OrderTimeline
                steps={createTimelineFromOrderStatus(
                  order.status,
                  order.created_at,
                  order.updated_at
                )}
              />

              {/* Información de Seguimiento */}
              {trackingInfo && (
                <div className="mt-6 pt-6 border-t space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Número de Seguimiento
                      </p>
                      <p className="text-sm text-gray-600 font-mono mt-1">
                        {trackingInfo.tracking_number || 'No disponible'}
                      </p>
                    </div>
                    
                    {trackingInfo.tracking_number && trackingInfo.carrier && (
                      <a
                        href={shipmentService.getCarrierTrackingUrl(
                          trackingInfo.carrier,
                          trackingInfo.tracking_number
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Rastrear en {trackingInfo.carrier}
                      </a>
                    )}
                  </div>

                  {trackingInfo.current_location && (
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Ubicación Actual
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {trackingInfo.current_location}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Fecha Estimada de Entrega */}
              {!['delivered', 'cancelled', 'refunded'].includes(order.status) && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-900">Entrega estimada</p>
                      <p className="text-sm text-blue-700">
                        {trackingInfo?.estimated_delivery
                          ? new Intl.DateTimeFormat('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }).format(new Date(trackingInfo.estimated_delivery))
                          : new Intl.DateTimeFormat('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }).format(estimatedDelivery)
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Order Items */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Productos ({order.items.length})
              </h2>
              
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 pb-4 border-b last:border-b-0">
                    <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900">
                        {item.product_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Cantidad: {item.quantity}
                      </p>
                      <p className="text-sm text-gray-500">
                        Precio unitario: {formatPrice(item.unit_price || 0)}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatPrice(item.total_price || item.subtotal || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Shipping Address */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Dirección de Envío
              </h2>
              
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900">
                  {order.shipping_address.firstName} {order.shipping_address.lastName}
                </p>
                <p>{order.shipping_address.address}</p>
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zipCode}
                </p>
                <p>{order.shipping_address.country}</p>
                <p className="mt-2">Tel: {order.shipping_address.phone}</p>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Resumen del Pedido
              </h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatPrice(order.subtotal)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Envío</span>
                  {!order.shipping_cost || Number(order.shipping_cost) === 0 ? (
                    <span className="text-green-600 font-semibold">¡Gratis!</span>
                  ) : (
                    <span className="text-gray-900">{formatPrice(order.shipping_cost)}</span>
                  )}
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">IVA</span>
                  <span className="text-gray-900">{formatPrice(order.tax_amount)}</span>
                </div>
                
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento</span>
                    <span>-{formatPrice(order.discount_amount)}</span>
                  </div>
                )}
                
                <div className="border-t pt-3">
                  <div className="flex justify-between text-base font-medium">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">{formatPrice(order.total_amount || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t space-y-3">
                <div className="text-sm">
                  <p className="text-gray-600 mb-1">Método de pago</p>
                  <p className="text-gray-900 font-medium capitalize">
                    {order.payment_method === 'card' ? 'Tarjeta de crédito' : order.payment_method}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => router.push('/contacto')}
                >
                  Contactar Soporte
                </Button>
                
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => router.push('/productos')}
                >
                  Seguir Comprando
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
