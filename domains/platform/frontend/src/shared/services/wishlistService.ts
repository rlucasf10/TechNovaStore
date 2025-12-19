/**
 * Servicio de Lista de Deseos (Wishlist)
 * 
 * Maneja la comunicación con el backend para gestionar la lista de deseos del usuario
 */

import axios, { AxiosInstance } from 'axios'
import { Product } from '@/types'

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
      // Usar secureLogger en lugar de console.error
      if (typeof window !== 'undefined') {
        const { secureLogger } = require('@/shared/lib/security')
        secureLogger.error('Error getting CSRF token:', error)
      }
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
        // Usar secureLogger en lugar de console.error
        if (typeof window !== 'undefined') {
          const { secureLogger } = require('@/shared/lib/security')
          secureLogger.error('Error al obtener CSRF token:', error)
        }
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
    // NO loguear errores 401 esperados (usuario no autenticado)
    // El componente manejará los errores de autenticación
    return Promise.reject(error)
  }
)

export interface WishlistItem {
  id: string
  productId: string
  product: Product
  addedAt: Date
}

export interface WishlistResponse {
  success: boolean
  data: WishlistItem[]
  message?: string
}

export interface AddToWishlistResponse {
  success: boolean
  data: WishlistItem
  message?: string
}

export interface RemoveFromWishlistResponse {
  success: boolean
  message?: string
}

class WishlistService {
  /**
   * Obtener la lista de deseos del usuario autenticado
   */
  async getWishlist(): Promise<WishlistResponse> {
    try {
      const response = await apiClient.get<WishlistResponse>('/wishlist')
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'Error al obtener la lista de deseos'
        throw new Error(errorMessage)
      }
      throw error
    }
  }

  /**
   * Agregar un producto a la lista de deseos
   */
  async addItem(productId: string): Promise<AddToWishlistResponse> {
    try {
      const response = await apiClient.post<AddToWishlistResponse>(
        '/wishlist',
        { productId }
      )
      
      // Registrar interacción con el recommender service (opcional)
      this.recordWishlistInteraction(productId).catch(() => {})
      
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'Error al agregar a la lista de deseos'
        throw new Error(errorMessage)
      }
      throw error
    }
  }

  /**
   * Eliminar un producto de la lista de deseos
   */
  async removeItem(productId: string): Promise<RemoveFromWishlistResponse> {
    try {
      const response = await apiClient.delete<RemoveFromWishlistResponse>(
        `/wishlist/${productId}`
      )
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'Error al eliminar de la lista de deseos'
        throw new Error(errorMessage)
      }
      throw error
    }
  }

  /**
   * Verificar si un producto está en la lista de deseos
   */
  async isInWishlist(productId: string, silent: boolean = true): Promise<boolean> {
    try {
      const response = await apiClient.get<{ success: boolean; data: { inWishlist: boolean } }>(
        `/wishlist/check/${productId}`
      )
      return response.data.data.inWishlist
    } catch (error) {
      // Solo loguear si no es silencioso (por defecto es silencioso para 404)
      if (!silent && typeof window !== 'undefined') {
        const { secureLogger } = require('@/shared/lib/security')
        secureLogger.error('Error checking wishlist:', { productId })
      }
      return false
    }
  }

  /**
   * Registrar interacción de wishlist con el recommender service
   */
  private async recordWishlistInteraction(productSku: string): Promise<void> {
    try {
      // ✅ SEGURIDAD: NO leer token de localStorage
      // El backend obtiene el userId automáticamente de la httpOnly cookie
      await apiClient.post('/recommender/record-interaction', {
        productSku,
        interactionType: 'wishlist',
        metadata: { timestamp: new Date().toISOString() },
      })
    } catch {
      // Interacción opcional, no lanzar error
    }
  }
}

export const wishlistService = new WishlistService()
