/**
 * Servicio de Pedidos
 * 
 * Maneja la comunicación con el Order Service del backend
 */

import axios, { AxiosInstance } from 'axios'
import { Order } from '@/types'
import { secureLogger } from '@/shared/lib/security'

// Tipo de CartItem del store (sin inStock ni addedAt)
export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  image: string
  sku: string
  brand?: string
  maxQuantity?: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

// CSRF token management
let csrfToken: string | null = null
let sessionId: string | null = null
let csrfPromise: Promise<{ token: string; sessionId: string }> | null = null

// Function to get CSRF token
const getCSRFToken = async (): Promise<{ token: string; sessionId: string }> => {
  // If we already have a token, return it
  if (csrfToken && sessionId) {
    return { token: csrfToken, sessionId }
  }

  // If we're already fetching, wait for that request
  if (csrfPromise) {
    return csrfPromise
  }

  // Start fetching
  csrfPromise = (async () => {
    try {
      // Generate a session ID if we don't have one
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      // Use appropriate base URL for CSRF token endpoint
      const csrfBaseUrl = typeof window !== 'undefined'
        ? (process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000')
        : (process.env.INTERNAL_API_URL?.replace('/api', '') || 'http://api-gateway:3000')

      const response = await axios.get(`${csrfBaseUrl}/api/csrf-token`, {
        headers: {
          'X-Session-ID': sessionId,
        },
        withCredentials: true,
        timeout: 5000,
      })

      csrfToken = response.data.csrfToken || response.data.token
      sessionId = response.data.sessionId || sessionId

      return { token: csrfToken!, sessionId: sessionId! }
    } catch (error) {
      secureLogger.error('Error getting CSRF token:', error)
      csrfPromise = null
      throw error
    } finally {
      csrfPromise = null
    }
  })()

  return csrfPromise
}

// Crear instancia de Axios con configuración para autenticación
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Importante: permite enviar cookies httpOnly
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar CSRF token (NO agregar Authorization header - se usa httpOnly cookie)
apiClient.interceptors.request.use(
  async (config) => {
    // ✅ SEGURIDAD: NO agregar Authorization header con token de localStorage
    // La autenticación se maneja mediante httpOnly cookies que el navegador envía automáticamente
    // Esto previene ataques XSS ya que JavaScript no puede acceder a las cookies httpOnly

    // Agregar CSRF token para métodos no seguros (POST, PUT, DELETE, PATCH)
    const isSafeMethod = config.method && ['get', 'head', 'options'].includes(config.method.toLowerCase())
    if (!isSafeMethod) {
      try {
        const { token: csrf, sessionId: sid } = await getCSRFToken()
        config.headers['X-CSRF-Token'] = csrf
        config.headers['X-Session-ID'] = sid
      } catch (error) {
        secureLogger.error('Failed to get CSRF token:', error)
        throw error
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      // NO loguear errores 401 esperados (usuario no autenticado)
      // Solo redirigir a login si no estamos ya ahí
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export interface CreateOrderRequest {
  // user_id se obtiene automáticamente del token JWT en el backend
  items: Array<{
    product_sku: string
    product_name: string
    quantity: number
    unit_price: number
  }>
  shipping_address: {
    street: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  billing_address: {
    street: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  payment_method: string
  notes?: string
}

export interface CreateOrderResponse {
  success: boolean
  data: Order
  message?: string
}

class OrderService {
  /**
   * Crear un nuevo pedido
   */
  async createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      secureLogger.log('📦 Creating order with data:', orderData)
      const response = await apiClient.post<CreateOrderResponse>(
        '/orders',
        orderData
      )
      
      secureLogger.log('✅ Order created successfully:', response.data)
      return response.data
    } catch (error) {
      secureLogger.error('❌ Error creating order:', error)
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'Error al crear el pedido'
        secureLogger.error('Error details:', error.response?.data)
        throw new Error(errorMessage)
      }
      throw error
    }
  }

  /**
   * Obtener pedidos del usuario actual
   */
  async getUserOrders(params?: {
    page?: number
    limit?: number
    status?: string
  }): Promise<{ data: Order[]; pagination: any }> {
    try {
      const response = await apiClient.get('/orders/my-orders', { params })
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Error al obtener pedidos')
      }
      throw error
    }
  }

  /**
   * Obtener un pedido por ID
   */
  async getOrderById(orderId: string, silent: boolean = false): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const response = await apiClient.get(`/orders/${orderId}`)
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message
      }
    } catch (error) {
      // Solo loguear si no es silencioso (para errores esperados como 404)
      if (!silent && axios.isAxiosError(error)) {
        secureLogger.error('Error getting order by ID:', { orderId, status: error.response?.status })
      }
      
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.message || 'Error al obtener el pedido'
        }
      }
      return {
        success: false,
        message: 'Error al obtener el pedido'
      }
    }
  }

  /**
   * Obtener un pedido por número de pedido
   */
  async getOrderByNumber(orderNumber: string): Promise<Order> {
    try {
      const response = await apiClient.get(`/orders/number/${orderNumber}`)
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Error al obtener el pedido')
      }
      throw error
    }
  }

  /**
   * Convertir items del carrito al formato requerido por el backend
   */
  convertCartItemsToOrderItems(cartItems: CartItem[]): CreateOrderRequest['items'] {
    return cartItems.map(item => ({
      product_sku: item.sku,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
    }))
  }
}

export const orderService = new OrderService()
