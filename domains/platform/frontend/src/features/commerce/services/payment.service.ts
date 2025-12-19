/**
 * Servicio de Pagos
 * 
 * Maneja la integración con proveedores de pago (Stripe, PayPal).
 */

import axios, { AxiosError } from 'axios';
import type {
  ProcessPaymentRequest,
  ProcessPaymentResponse,
  PaymentIntent,
  PaymentMethod,
  CheckoutError,
} from '../types/checkout.types';

// ============================================================================
// Configuración
// ============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const paymentAxios = axios.create({
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

function handlePaymentError(error: unknown): CheckoutError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      code?: string;
      message?: string;
    }>;

    if (!axiosError.response) {
      return {
        code: 'network-error',
        message: 'Error de conexión. Verifica tu internet.',
      };
    }

    const status = axiosError.response.status;
    const data = axiosError.response.data;

    if (status === 402) {
      return {
        code: 'payment-failed',
        message: data?.message || 'El pago no pudo ser procesado',
      };
    }

    if (status === 400) {
      return {
        code: 'invalid-payment-method',
        message: data?.message || 'Método de pago inválido',
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
// Clase PaymentService
// ============================================================================

class PaymentService {
  /**
   * Crear un Payment Intent (para Stripe)
   */
  async createPaymentIntent(
    orderId: number,
    amount: number
  ): Promise<PaymentIntent> {
    try {
      const response = await paymentAxios.post<{
        success: boolean;
        data: PaymentIntent;
      }>('/payments/create-intent', {
        orderId,
        amount,
      });

      return response.data.data;
    } catch (error) {
      throw handlePaymentError(error);
    }
  }

  /**
   * Procesar un pago
   */
  async processPayment(data: ProcessPaymentRequest): Promise<ProcessPaymentResponse['data']> {
    try {
      const response = await paymentAxios.post<ProcessPaymentResponse>(
        '/payments/process',
        data
      );

      return response.data.data;
    } catch (error) {
      throw handlePaymentError(error);
    }
  }

  /**
   * Confirmar un pago de Stripe
   */
  async confirmStripePayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; transactionId: string }> {
    try {
      const response = await paymentAxios.post<{
        success: boolean;
        data: { transactionId: string };
      }>('/payments/stripe/confirm', {
        paymentIntentId,
        paymentMethodId,
      });

      return {
        success: response.data.success,
        transactionId: response.data.data.transactionId,
      };
    } catch (error) {
      throw handlePaymentError(error);
    }
  }

  /**
   * Crear orden de PayPal
   */
  async createPayPalOrder(orderId: number, amount: number): Promise<{ orderId: string }> {
    try {
      const response = await paymentAxios.post<{
        success: boolean;
        data: { orderId: string };
      }>('/payments/paypal/create-order', {
        orderId,
        amount,
      });

      return response.data.data;
    } catch (error) {
      throw handlePaymentError(error);
    }
  }

  /**
   * Capturar pago de PayPal
   */
  async capturePayPalPayment(
    paypalOrderId: string
  ): Promise<{ success: boolean; transactionId: string }> {
    try {
      const response = await paymentAxios.post<{
        success: boolean;
        data: { transactionId: string };
      }>('/payments/paypal/capture', {
        paypalOrderId,
      });

      return {
        success: response.data.success,
        transactionId: response.data.data.transactionId,
      };
    } catch (error) {
      throw handlePaymentError(error);
    }
  }

  /**
   * Obtener métodos de pago guardados del usuario
   */
  async getSavedPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await paymentAxios.get<{
        success: boolean;
        data: { paymentMethods: PaymentMethod[] };
      }>('/payments/methods');

      return response.data.data.paymentMethods;
    } catch (error) {
      throw handlePaymentError(error);
    }
  }

  /**
   * Guardar un método de pago
   */
  async savePaymentMethod(paymentMethod: PaymentMethod): Promise<PaymentMethod> {
    try {
      const response = await paymentAxios.post<{
        success: boolean;
        data: PaymentMethod;
      }>('/payments/methods', paymentMethod);

      return response.data.data;
    } catch (error) {
      throw handlePaymentError(error);
    }
  }

  /**
   * Eliminar un método de pago
   */
  async deletePaymentMethod(paymentMethodId: number): Promise<void> {
    try {
      await paymentAxios.delete(`/payments/methods/${paymentMethodId}`);
    } catch (error) {
      throw handlePaymentError(error);
    }
  }

  /**
   * Validar número de tarjeta con algoritmo de Luhn
   */
  validateCardNumber(cardNumber: string): boolean {
    // Remover espacios y guiones
    const cleaned = cardNumber.replace(/[\s-]/g, '');

    // Verificar que solo contenga dígitos
    if (!/^\d+$/.test(cleaned)) {
      return false;
    }

    // Verificar longitud (13-19 dígitos)
    if (cleaned.length < 13 || cleaned.length > 19) {
      return false;
    }

    // Algoritmo de Luhn
    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Detectar marca de tarjeta
   */
  detectCardBrand(cardNumber: string): 'visa' | 'mastercard' | 'amex' | 'discover' | null {
    const cleaned = cardNumber.replace(/[\s-]/g, '');

    if (/^4/.test(cleaned)) {
      return 'visa';
    }

    if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) {
      return 'mastercard';
    }

    if (/^3[47]/.test(cleaned)) {
      return 'amex';
    }

    if (/^6(?:011|5)/.test(cleaned)) {
      return 'discover';
    }

    return null;
  }

  /**
   * Formatear número de tarjeta
   */
  formatCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    const brand = this.detectCardBrand(cleaned);

    if (brand === 'amex') {
      // American Express: 4-6-5
      return cleaned.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
    }

    // Otras tarjetas: 4-4-4-4
    return cleaned.replace(/(\d{4})/g, '$1 ').trim();
  }

  /**
   * Enmascarar número de tarjeta
   */
  maskCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    const last4 = cleaned.slice(-4);
    return `•••• •••• •••• ${last4}`;
  }
}

// Exportar instancia única del servicio
export const paymentService = new PaymentService();
export default paymentService;
