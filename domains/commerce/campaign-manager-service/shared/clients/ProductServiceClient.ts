/**
 * Cliente para comunicación con el Product Service
 * 
 * Implementa métodos para obtener y actualizar productos,
 * con retry automático y backoff exponencial en caso de fallos.
 */

import axios, { AxiosInstance, AxiosError } from 'axios'
import { config } from '../../config'
import { ProductFilters, ProductUpdate } from '../types'
import { logger } from '../utils/logger'

/**
 * Interfaz de producto del Product Service
 * 
 * Representa la estructura de un producto en el Product Service.
 * Incluye campos de campaña que serán agregados al Product Service.
 */
export interface Product {
  id: string
  sku: string
  name: string
  description: string
  category: string
  subcategory: string
  brand: string
  specifications: Record<string, any>
  images: string[]
  providers: Array<{
    name: string
    price: number
    availability: boolean
    shipping_cost: number
    delivery_time: number
    last_updated: Date
  }>
  our_price: number
  markup_percentage: number
  is_active: boolean
  created_at: Date
  updated_at: Date
  
  // Campos de campaña (a agregar en Product Service)
  in_campaign?: boolean
  campaign_id?: string
  campaign_price?: number
  original_price?: number
  discount_percentage?: number
}

/**
 * Opciones de configuración para retry
 */
interface RetryOptions {
  maxRetries: number
  baseDelay: number
  maxDelay: number
}

/**
 * Cliente HTTP para Product Service
 * 
 * Proporciona métodos para interactuar con el Product Service,
 * incluyendo obtención y actualización de productos.
 * Implementa retry automático con backoff exponencial.
 */
export class ProductServiceClient {
  private client: AxiosInstance
  private retryOptions: RetryOptions

  constructor(
    baseURL: string = config.productServiceUrl,
    retryOptions: Partial<RetryOptions> = {}
  ) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.retryOptions = {
      maxRetries: retryOptions.maxRetries ?? 3,
      baseDelay: retryOptions.baseDelay ?? 1000,
      maxDelay: retryOptions.maxDelay ?? 10000
    }
  }

  /**
   * Ejecuta una operación con retry y backoff exponencial
   * 
   * @param operation - Función asíncrona a ejecutar
   * @returns Resultado de la operación
   * @throws Error si todos los reintentos fallan
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt <= this.retryOptions.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        // No reintentar en errores 4xx (excepto 429 Too Many Requests)
        if (axios.isAxiosError(error)) {
          const status = error.response?.status
          if (status && status >= 400 && status < 500 && status !== 429) {
            throw error
          }
        }
        
        // Si es el último intento, lanzar el error
        if (attempt === this.retryOptions.maxRetries) {
          throw error
        }
        
        // Calcular delay con backoff exponencial
        const delay = Math.min(
          this.retryOptions.baseDelay * Math.pow(2, attempt),
          this.retryOptions.maxDelay
        )
        
        logger.warn('ProductServiceClient retry attempt', {
          attempt: attempt + 1,
          maxRetries: this.retryOptions.maxRetries,
          delayMs: delay,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
        
        // Esperar antes del siguiente intento
        await this.sleep(delay)
      }
    }
    
    throw lastError || new Error('Operación falló después de todos los reintentos')
  }

  /**
   * Pausa la ejecución por un tiempo determinado
   * 
   * @param ms - Milisegundos a esperar
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Obtiene un producto por su ID
   * 
   * @param productId - ID del producto
   * @returns Producto encontrado o null si no existe
   * @throws Error si el servicio no está disponible
   */
  async getProduct(productId: string): Promise<Product | null> {
    return this.executeWithRetry(async () => {
      try {
        const response = await this.client.get<Product>(`/products/${productId}`)
        return response.data
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return null
        }
        throw error
      }
    })
  }

  /**
   * Obtiene múltiples productos con filtros opcionales
   * 
   * @param filters - Filtros de búsqueda
   * @returns Lista de productos que cumplen los filtros
   * @throws Error si el servicio no está disponible
   */
  async getProducts(filters: ProductFilters = {}): Promise<Product[]> {
    return this.executeWithRetry(async () => {
      // El Product Service usa /products (sin /api)
      const response = await this.client.get<{ success: boolean; data: Product[] }>('/products', {
        params: filters
      })
      // El Product Service devuelve { success: true, data: [...] }
      return response.data.data || []
    })
  }

  /**
   * Obtiene productos de una categoría específica
   * 
   * @param category - Nombre de la categoría
   * @returns Lista de productos de la categoría
   * @throws Error si el servicio no está disponible
   */
  async getProductsByCategory(category: string): Promise<Product[]> {
    return this.getProducts({ category, isActive: true })
  }

  /**
   * Actualiza los campos de campaña de un producto
   * 
   * @param productId - ID del producto a actualizar
   * @param data - Datos de campaña a actualizar
   * @returns Producto actualizado
   * @throws Error si el producto no existe o el servicio no está disponible
   */
  async updateProduct(
    productId: string,
    data: Partial<Product>
  ): Promise<Product> {
    return this.executeWithRetry(async () => {
      // Usar el endpoint específico de campaña: PATCH /products/:id/campaign
      const response = await this.client.patch<{ success: boolean; data: Product }>(
        `/products/${productId}/campaign`,
        data
      )
      return response.data.data || response.data as unknown as Product
    })
  }

  /**
   * Limpia los campos de campaña de un producto
   * 
   * @param productId - ID del producto a limpiar
   * @returns Producto actualizado
   * @throws Error si el producto no existe o el servicio no está disponible
   */
  async clearProductCampaign(productId: string): Promise<Product> {
    return this.executeWithRetry(async () => {
      // Usar el endpoint específico: DELETE /products/:id/campaign
      const response = await this.client.delete<{ success: boolean; data: Product }>(
        `/products/${productId}/campaign`
      )
      return response.data.data || response.data as unknown as Product
    })
  }

  /**
   * Actualiza múltiples productos en lote
   * 
   * Procesa actualizaciones de productos de forma eficiente,
   * útil para aplicar o remover descuentos de campaña.
   * 
   * @param updates - Lista de actualizaciones a aplicar
   * @throws Error si alguna actualización falla
   */
  async updateProductsBatch(updates: ProductUpdate[]): Promise<void> {
    return this.executeWithRetry(async () => {
      // Procesar actualizaciones en paralelo con límite de concurrencia
      const batchSize = 10
      
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize)
        
        await Promise.all(
          batch.map(update =>
            this.updateProduct(update.productId, update.data as Partial<Product>)
          )
        )
      }
    })
  }

  /**
   * Verifica si el Product Service está disponible
   * 
   * @returns true si el servicio responde correctamente
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health')
      return true
    } catch (error) {
      return false
    }
  }
}

// Exportar instancia singleton
export const productServiceClient = new ProductServiceClient()
