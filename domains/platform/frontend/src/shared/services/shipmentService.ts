/**
 * Servicio de Seguimiento de Envíos
 * 
 * Maneja la comunicación con el Shipment Tracker Service del backend
 */

import axios, { AxiosInstance } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

// Crear instancia de Axios con configuración para autenticación
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ✅ SEGURIDAD: NO agregar interceptor de Authorization header
// La autenticación se maneja mediante httpOnly cookies que el navegador envía automáticamente
// con withCredentials: true. Esto previene ataques XSS ya que JavaScript no puede acceder
// a las cookies httpOnly.

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // NO loguear errores 401 esperados (usuario no autenticado)
      // Solo redirigir a login si no estamos ya ahí
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export interface TrackingEvent {
  status: string
  location?: string
  timestamp: string
  description?: string
}

export interface TrackingInfo {
  order_number: string
  tracking_number?: string
  carrier?: string
  status: string
  estimated_delivery?: string
  current_location?: string
  events: TrackingEvent[]
  last_updated: string
  carrier_tracking_url?: string
}

export interface ShipmentStatus {
  order_number: string
  status: string
  last_updated: string
  estimated_delivery?: string
}

class ShipmentService {
  /**
   * Obtener información de seguimiento de un pedido
   */
  async getTrackingInfo(orderNumber: string, silent: boolean = false): Promise<TrackingInfo> {
    try {
      const response = await apiClient.get(`/tracking/${orderNumber}`)
      return response.data.data || response.data
    } catch (error) {
      // Solo loguear si no es silencioso (para errores esperados como 404)
      if (!silent && axios.isAxiosError(error) && typeof window !== 'undefined') {
        const { secureLogger } = require('@/shared/lib/security')
        secureLogger.error('Error getting tracking info:', { orderNumber, status: error.response?.status })
      }
      
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Error al obtener información de seguimiento'
        )
      }
      throw error
    }
  }

  /**
   * Actualizar información de seguimiento de un pedido manualmente
   */
  async updateTrackingInfo(orderNumber: string): Promise<TrackingInfo> {
    try {
      const response = await apiClient.post(`/tracking/update/${orderNumber}`)
      return response.data.data || response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Error al actualizar información de seguimiento'
        )
      }
      throw error
    }
  }

  /**
   * Obtener estado actual del envío
   */
  async getShipmentStatus(orderNumber: string, silent: boolean = false): Promise<ShipmentStatus> {
    try {
      const response = await apiClient.get(`/tracking/status/${orderNumber}`)
      return response.data.data || response.data
    } catch (error) {
      // Solo loguear si no es silencioso (para errores esperados como 404)
      if (!silent && axios.isAxiosError(error) && typeof window !== 'undefined') {
        const { secureLogger } = require('@/shared/lib/security')
        secureLogger.error('Error getting shipment status:', { orderNumber, status: error.response?.status })
      }
      
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Error al obtener estado del envío'
        )
      }
      throw error
    }
  }

  /**
   * Generar URL de seguimiento del carrier
   */
  getCarrierTrackingUrl(carrier: string, trackingNumber: string): string {
    const carrierUrls: Record<string, string> = {
      amazon: `https://www.amazon.com/progress-tracker/package/ref=ppx_yo_dt_b_track_package?_encoding=UTF8&itemId=${trackingNumber}`,
      aliexpress: `https://track.aliexpress.com/logisticsdetail.htm?tradeId=${trackingNumber}`,
      ebay: `https://www.ebay.com/sh/ord/?filter=status:ALL_ORDERS&orderid=${trackingNumber}`,
      banggood: `https://www.banggood.com/index.php?com=account&t=orderDetail&orderId=${trackingNumber}`,
      newegg: `https://www.newegg.com/Info/TrackOrder.aspx?TrackingNumber=${trackingNumber}`,
      dhl: `https://www.dhl.com/es-es/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingNumber}`,
      fedex: `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
      ups: `https://www.ups.com/track?loc=es_ES&tracknum=${trackingNumber}`,
      correos: `https://www.correos.es/es/es/herramientas/localizador/envios?numero=${trackingNumber}`,
    }

    return carrierUrls[carrier.toLowerCase()] || `https://www.google.com/search?q=track+${trackingNumber}`
  }

  /**
   * Normalizar estado del envío a formato legible
   */
  normalizeStatus(status: string): string {
    const statusMap: Record<string, string> = {
      label_created: 'Etiqueta Creada',
      picked_up: 'Recogido',
      in_transit: 'En Tránsito',
      out_for_delivery: 'En Reparto',
      delivered: 'Entregado',
      exception: 'Incidencia',
      returned: 'Devuelto',
      cancelled: 'Cancelado',
    }

    return statusMap[status] || status
  }
}

export const shipmentService = new ShipmentService()
