/**
 * Servicio de Checkout
 * 
 * Maneja la creación de pedidos y el proceso de checkout.
 */

import axios, { AxiosError } from 'axios';
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  Order,
  ValidateDiscountCodeRequest,
  ValidateDiscountCodeResponse,
  CalculateShippingRequest,
  CalculateShippingResponse,
  CheckoutError,
} from '../types/checkout.types';

// ============================================================================
// Configuración
// ============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const checkoutAxios = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ SEGURIDAD: NO agregamos Authorization header con tokens de localStorage
// La autenticación se maneja automáticamente mediante httpOnly cookies
// que el navegador envía con withCredentials: true
// No se requiere interceptor de autenticación

// ============================================================================
// Manejo de Errores
// ============================================================================

function handleCheckoutError(error: unknown): CheckoutError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      code?: string;
      message?: string;
      field?: string;
    }>;

    if (!axiosError.response) {
      return {
        code: 'network-error',
        message: 'Error de conexión. Verifica tu internet.',
      };
    }

    const status = axiosError.response.status;
    const data = axiosError.response.data;

    if (status === 400) {
      return {
        code: (data?.code as any) || 'invalid-address',
        message: data?.message || 'Datos inválidos',
        field: data?.field,
      };
    }

    if (status === 402) {
      return {
        code: 'payment-failed',
        message: data?.message || 'El pago no pudo ser procesado',
      };
    }

    if (status === 409) {
      return {
        code: 'insufficient-stock',
        message: data?.message || 'Algunos productos no tienen stock suficiente',
      };
    }

    if (status >= 500) {
      return {
        code: 'server-error',
        message: 'Error del servidor. Intenta de nuevo más tarde.',
      };
    }
  }

  return {
    code: 'server-error',
    message: 'Ocurrió un error inesperado.',
  };
}

// ============================================================================
// Clase CheckoutService
// ============================================================================

class CheckoutService {
  /**
   * Crear un nuevo pedido
   */
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    try {
      const response = await checkoutAxios.post<CreateOrderResponse>(
        '/orders/create',
        data
      );

      if (!response.data.data || !response.data.data.order) {
        throw new Error('No order data received');
      }

      return response.data.data.order;
    } catch (error) {
      throw handleCheckoutError(error);
    }
  }

  /**
   * Obtener un pedido por ID
   */
  async getOrder(orderId: number): Promise<Order> {
    try {
      const response = await checkoutAxios.get<{ success: boolean; data: Order }>(
        `/orders/${orderId}`
      );

      if (!response.data.data) {
        throw new Error('No order data received');
      }

      return response.data.data;
    } catch (error) {
      throw handleCheckoutError(error);
    }
  }

  /**
   * Validar código de descuento
   */
  async validateDiscountCode(
    code: string,
    subtotal: number
  ): Promise<ValidateDiscountCodeResponse['data']> {
    try {
      const response = await checkoutAxios.post<ValidateDiscountCodeResponse>(
        '/orders/validate-discount',
        { code, subtotal } as ValidateDiscountCodeRequest
      );

      return response.data.data;
    } catch (error) {
      throw handleCheckoutError(error);
    }
  }

  /**
   * Calcular costo de envío
   */
  async calculateShipping(
    data: CalculateShippingRequest
  ): Promise<CalculateShippingResponse['data']> {
    try {
      const response = await checkoutAxios.post<CalculateShippingResponse>(
        '/orders/calculate-shipping',
        data
      );

      return response.data.data;
    } catch (error) {
      throw handleCheckoutError(error);
    }
  }

  /**
   * Obtener pedidos del usuario
   */
  async getUserOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ orders: Order[]; total: number; page: number; totalPages: number }> {
    try {
      const response = await checkoutAxios.get<{
        success: boolean;
        data: {
          orders: Order[];
          total: number;
          page: number;
          totalPages: number;
        };
      }>('/orders', { params });

      return response.data.data;
    } catch (error) {
      throw handleCheckoutError(error);
    }
  }

  /**
   * Cancelar un pedido
   */
  async cancelOrder(orderId: number, reason?: string): Promise<Order> {
    try {
      const response = await checkoutAxios.post<{ success: boolean; data: Order }>(
        `/orders/${orderId}/cancel`,
        { reason }
      );

      return response.data.data;
    } catch (error) {
      throw handleCheckoutError(error);
    }
  }
}

// Exportar instancia única del servicio
export const checkoutService = new CheckoutService();
export default checkoutService;
