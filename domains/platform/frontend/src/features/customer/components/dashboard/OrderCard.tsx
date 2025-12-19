'use client'

import { useState } from 'react'
import { Order, OrderStatus } from '@/types'
import { Eye, Truck, Download, Package, ChevronDown, ChevronUp, MapPin, CreditCard, Calendar, ShoppingCart, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAddToCart } from '@/commerce'
import { useToast } from '@/shared/hooks/useToast'

interface OrderCardProps {
  order: Order
}

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-purple-100 text-purple-800 border-purple-200',
  shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  delivered: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  refunded: 'bg-gray-100 text-gray-800 border-gray-200'
}

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado'
}

export function OrderCard({ order }: OrderCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false)
  const router = useRouter()
  const { mutateAsync: addToCart } = useAddToCart()
  const toast = useToast()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  // Calcular subtotal, envío e impuestos estimados
  const calculateBreakdown = () => {
    const subtotal = order.items.reduce((sum, item) => sum + item.total_price, 0)
    const taxRate = 0.21 // IVA 21%
    const taxAmount = subtotal * taxRate
    const shippingCost = order.total_amount - subtotal - taxAmount
    
    return {
      subtotal,
      shipping: Math.max(0, shippingCost),
      tax: taxAmount
    }
  }

  const breakdown = calculateBreakdown()

  // Función para reordenar (agregar todos los productos del pedido al carrito)
  const handleReorder = async () => {
    try {
      setIsReordering(true)
      
      // Agregar cada producto del pedido al carrito
      // Nota: Usamos el SKU del producto para buscarlo en el catálogo
      let addedCount = 0
      for (const item of order.items) {
        try {
          // TODO: Necesitamos obtener el productId desde el SKU
          // Por ahora, asumimos que el SKU es el ID del producto
          await addToCart({
            productId: item.product_sku,
            quantity: item.quantity,
          })
          addedCount++
        } catch (error) {
          console.error(`Error al agregar producto ${item.product_sku}:`, error)
          // Continuar con los demás productos
        }
      }

      if (addedCount > 0) {
        toast.success(
          `${addedCount} producto${addedCount !== 1 ? 's' : ''} agregado${addedCount !== 1 ? 's' : ''} al carrito`,
          'Productos agregados'
        )

        // Redirigir al carrito después de un breve delay
        setTimeout(() => {
          router.push('/carrito')
        }, 1000)
      } else {
        toast.error(
          'No se pudieron agregar los productos al carrito',
          'Error'
        )
      }
    } catch (error) {
      console.error('Error al reordenar:', error)
      toast.error(
        'No se pudieron agregar los productos al carrito',
        'Error'
      )
    } finally {
      setIsReordering(false)
    }
  }

  // Función para descargar factura
  const handleDownloadInvoice = async () => {
    try {
      setIsDownloadingInvoice(true)
      
      // TODO: Implementar descarga real de factura desde el backend
      // Por ahora, simulamos la descarga
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
      const invoiceUrl = `${API_URL}/orders/${order.id}/invoice`
      
      // ✅ SEGURIDAD: NO agregamos Authorization header con tokens de localStorage
      // La autenticación se maneja automáticamente mediante httpOnly cookies
      // que el navegador envía con credentials: 'include'
      const response = await fetch(invoiceUrl, {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Error al descargar la factura')
      }

      // Obtener el blob de la respuesta
      const blob = await response.blob()
      
      // Crear un enlace temporal para descargar el archivo
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `factura-${order.order_number}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(
        `Factura del pedido #${order.order_number} descargada correctamente`,
        'Factura descargada'
      )
    } catch (error) {
      console.error('Error al descargar factura:', error)
      toast.error(
        'No se pudo descargar la factura. Intenta de nuevo más tarde.',
        'Error'
      )
    } finally {
      setIsDownloadingInvoice(false)
    }
  }

  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 bg-white dark:bg-slate-800">
      {/* Order Header - Diseño mejorado */}
      <div className="p-5 bg-gradient-to-r from-gray-50 to-white dark:from-slate-700 dark:to-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Información principal */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                  #{order.order_number}
                </h3>
              </div>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusColors[order.status]}`}>
                {statusLabels[order.status]}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(order.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Total: {formatPrice(order.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Thumbnails de productos */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {order.items.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="w-12 h-12 rounded-lg border-2 border-white dark:border-slate-700 bg-gray-100 dark:bg-slate-600 overflow-hidden shadow-sm"
                  title={item.product_name}
                >
                  <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs">
                    <Package className="w-6 h-6" />
                  </div>
                </div>
              ))}
              {order.items.length > 3 && (
                <div className="w-12 h-12 rounded-lg border-2 border-white dark:border-slate-700 bg-gray-200 dark:bg-slate-600 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 shadow-sm">
                  +{order.items.length - 3}
                </div>
              )}
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Acciones principales */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
            >
              <Eye className="w-4 h-4" />
              <span>Ver Detalles</span>
              {showDetails ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {order.tracking_number && (
              <a
                href={`/pedidos/${order.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Truck className="w-4 h-4" />
                <span>Rastrear</span>
              </a>
            )}

            <button
              onClick={handleDownloadInvoice}
              disabled={isDownloadingInvoice}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title="Descargar factura"
            >
              {isDownloadingInvoice ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {isDownloadingInvoice ? 'Descargando...' : 'Factura'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Order Details - Expandible */}
      {showDetails && (
        <div className="border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
          <div className="p-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lista de Productos */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Productos
                </h4>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                      {/* Thumbnail del producto */}
                      <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gray-100 dark:bg-slate-700 overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                          <Package className="w-8 h-8" />
                        </div>
                      </div>

                      {/* Información del producto */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {item.product_name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          SKU: {item.product_sku}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Cantidad: {item.quantity}
                          </span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {formatPrice(item.total_price)}
                          </span>
                        </div>
                        {item.provider_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Proveedor: {item.provider_name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resumen de costos */}
                <div className="mt-4 p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Subtotal:</span>
                      <span>{formatPrice(breakdown.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Envío:</span>
                      <span>{formatPrice(breakdown.shipping)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Impuestos (IVA 21%):</span>
                      <span>{formatPrice(breakdown.tax)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 dark:text-gray-100 pt-2 border-t border-gray-200 dark:border-slate-700">
                      <span>Total:</span>
                      <span>{formatPrice(order.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de Envío y Pago */}
              <div className="space-y-6">
                {/* Dirección de envío */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Dirección de Envío
                  </h4>
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.shipping_address.street}<br />
                      {order.shipping_address.city}, {order.shipping_address.state}<br />
                      {order.shipping_address.postal_code}<br />
                      {order.shipping_address.country}
                    </p>
                  </div>
                </div>

                {/* Información de pago */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Información de Pago
                  </h4>
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Método:</span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium capitalize">
                        {order.payment_method.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Estado:</span>
                      <span className={`font-medium ${
                        order.payment_status === 'completed' ? 'text-green-600 dark:text-green-400' : 
                        order.payment_status === 'failed' ? 'text-red-600 dark:text-red-400' : 
                        order.payment_status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {order.payment_status === 'completed' ? 'Completado' :
                         order.payment_status === 'failed' ? 'Fallido' :
                         order.payment_status === 'pending' ? 'Pendiente' : 'Reembolsado'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tracking y entrega */}
                {(order.tracking_number || order.estimated_delivery) && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Seguimiento
                    </h4>
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 space-y-2">
                      {order.tracking_number && (
                        <div className="text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Número de seguimiento:</span>
                          <p className="text-gray-900 dark:text-gray-100 font-mono font-medium mt-1">
                            {order.tracking_number}
                          </p>
                        </div>
                      )}
                      {order.estimated_delivery && (
                        <div className="text-sm pt-2 border-t border-gray-200 dark:border-slate-700">
                          <span className="text-gray-600 dark:text-gray-400">Entrega estimada:</span>
                          <p className="text-gray-900 dark:text-gray-100 font-medium mt-1">
                            {formatDateTime(order.estimated_delivery)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones adicionales */}
            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
              {order.status === 'delivered' && (
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  ⭐ Dejar Reseña
                </button>
              )}
              {['pending', 'confirmed'].includes(order.status) && (
                <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
                  ✕ Cancelar Pedido
                </button>
              )}
              <button 
                onClick={() => router.push('/contacto')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
              >
                💬 Contactar Soporte
              </button>
              <button 
                onClick={handleReorder}
                disabled={isReordering}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReordering ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Agregando...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Volver a Comprar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}