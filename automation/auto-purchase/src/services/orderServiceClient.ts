import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../utils/logger';

export interface OrderServiceConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  apiKey?: string;
}

export interface OrderUpdateData {
  status?: string;
  provider_order_id?: string;
  provider_name?: string;
  tracking_number?: string;
  estimated_delivery?: Date;
  actual_cost?: number;
  error_message?: string;
}

export interface OrderServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status_code?: number;
}

export class OrderServiceClient {
  private client: AxiosInstance;
  private config: OrderServiceConfig;

  constructor(config: OrderServiceConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`Order Service API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          data: config.data
        });
        return config;
      },
      (error) => {
        logger.error('Order Service API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`Order Service API Response: ${response.status}`, {
          data: response.data
        });
        return response;
      },
      (error) => {
        logger.error('Order Service API Response Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Updates order status in the Order Service
   * Requirements: 2.5 - Integration with Order Service for status updates
   */
  async updateOrderStatus(orderId: number, status: string): Promise<OrderServiceResponse> {
    try {
      const response = await this.executeWithRetry(async () => {
        return this.client.put(`/orders/${orderId}/status`, { status });
      });

      logger.info(`Order status updated successfully`, {
        orderId,
        status,
        responseStatus: response.status
      });

      return {
        success: true,
        data: response.data,
        status_code: response.status
      };
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      
      logger.error(`Failed to update order status`, {
        orderId,
        status,
        error: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        status_code: this.extractStatusCode(error)
      };
    }
  }

  /**
   * Updates order with provider information
   */
  async updateOrderWithProviderInfo(
    orderId: number,
    updateData: OrderUpdateData
  ): Promise<OrderServiceResponse> {
    try {
      const response = await this.executeWithRetry(async () => {
        return this.client.put(`/orders/${orderId}/provider-info`, updateData);
      });

      logger.info(`Order provider info updated successfully`, {
        orderId,
        providerOrderId: updateData.provider_order_id,
        providerName: updateData.provider_name,
        responseStatus: response.status
      });

      return {
        success: true,
        data: response.data,
        status_code: response.status
      };
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      
      logger.error(`Failed to update order provider info`, {
        orderId,
        updateData,
        error: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        status_code: this.extractStatusCode(error)
      };
    }
  }

  /**
   * Marks order as processing
   */
  async markOrderAsProcessing(orderId: number): Promise<OrderServiceResponse> {
    try {
      const response = await this.executeWithRetry(async () => {
        return this.client.post(`/orders/${orderId}/mark-processing`);
      });

      logger.info(`Order marked as processing`, {
        orderId,
        responseStatus: response.status
      });

      return {
        success: true,
        data: response.data,
        status_code: response.status
      };
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      
      logger.error(`Failed to mark order as processing`, {
        orderId,
        error: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        status_code: this.extractStatusCode(error)
      };
    }
  }

  /**
   * Updates order tracking information
   */
  async updateTrackingInfo(
    orderId: number,
    trackingNumber: string,
    estimatedDelivery?: Date
  ): Promise<OrderServiceResponse> {
    try {
      const updateData = {
        tracking_number: trackingNumber,
        ...(estimatedDelivery && { estimated_delivery: estimatedDelivery })
      };

      const response = await this.executeWithRetry(async () => {
        return this.client.put(`/orders/${orderId}/tracking`, updateData);
      });

      logger.info(`Order tracking info updated`, {
        orderId,
        trackingNumber,
        estimatedDelivery,
        responseStatus: response.status
      });

      return {
        success: true,
        data: response.data,
        status_code: response.status
      };
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      
      logger.error(`Failed to update tracking info`, {
        orderId,
        trackingNumber,
        error: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        status_code: this.extractStatusCode(error)
      };
    }
  }

  /**
   * Gets order details from Order Service
   */
  async getOrder(orderId: number): Promise<OrderServiceResponse> {
    try {
      const response = await this.executeWithRetry(async () => {
        return this.client.get(`/orders/${orderId}`);
      });

      return {
        success: true,
        data: response.data,
        status_code: response.status
      };
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      
      logger.error(`Failed to get order`, {
        orderId,
        error: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        status_code: this.extractStatusCode(error)
      };
    }
  }

  /**
   * Gets orders ready for auto-purchase
   */
  async getOrdersForAutoPurchase(): Promise<OrderServiceResponse> {
    try {
      const response = await this.executeWithRetry(async () => {
        return this.client.get('/orders/auto-purchase/pending');
      });

      logger.info(`Retrieved orders for auto-purchase`, {
        count: response.data?.length || 0
      });

      return {
        success: true,
        data: response.data,
        status_code: response.status
      };
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      
      logger.error(`Failed to get orders for auto-purchase`, {
        error: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        status_code: this.extractStatusCode(error)
      };
    }
  }

  /**
   * Reports auto-purchase failure
   */
  async reportAutoPurchaseFailure(
    orderId: number,
    errorMessage: string,
    providerAttempts: string[]
  ): Promise<OrderServiceResponse> {
    try {
      const failureData = {
        error_message: errorMessage,
        provider_attempts: providerAttempts,
        failed_at: new Date()
      };

      const response = await this.executeWithRetry(async () => {
        return this.client.post(`/orders/${orderId}/auto-purchase/failure`, failureData);
      });

      logger.info(`Auto-purchase failure reported`, {
        orderId,
        errorMessage,
        providerAttempts,
        responseStatus: response.status
      });

      return {
        success: true,
        data: response.data,
        status_code: response.status
      };
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      
      logger.error(`Failed to report auto-purchase failure`, {
        orderId,
        error: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        status_code: this.extractStatusCode(error)
      };
    }
  }

  /**
   * Reports successful auto-purchase
   */
  async reportAutoPurchaseSuccess(
    orderId: number,
    providerOrderId: string,
    providerName: string,
    totalCost: number,
    estimatedDelivery: Date
  ): Promise<OrderServiceResponse> {
    try {
      const successData = {
        provider_order_id: providerOrderId,
        provider_name: providerName,
        total_cost: totalCost,
        estimated_delivery: estimatedDelivery,
        purchased_at: new Date()
      };

      const response = await this.executeWithRetry(async () => {
        return this.client.post(`/orders/${orderId}/auto-purchase/success`, successData);
      });

      logger.info(`Auto-purchase success reported`, {
        orderId,
        providerOrderId,
        providerName,
        totalCost,
        responseStatus: response.status
      });

      return {
        success: true,
        data: response.data,
        status_code: response.status
      };
    } catch (error) {
      const errorMessage = this.extractErrorMessage(error);
      
      logger.error(`Failed to report auto-purchase success`, {
        orderId,
        error: errorMessage
      });

      return {
        success: false,
        error: errorMessage,
        status_code: this.extractStatusCode(error)
      };
    }
  }

  /**
   * Executes a request with retry logic
   */
  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on client errors (4xx)
        if (this.isClientError(error)) {
          throw error;
        }
        
        if (attempt < this.config.retryAttempts) {
          const delay = this.calculateRetryDelay(attempt);
          logger.warn(`Order Service request failed, retrying in ${delay}ms (attempt ${attempt}/${this.config.retryAttempts})`, {
            error: lastError.message,
            attempt
          });
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError!;
  }

  /**
   * Calculates retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 10000; // 10 seconds
    const delay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * delay;
    
    return Math.min(delay + jitter, maxDelay);
  }

  /**
   * Checks if error is a client error (4xx)
   */
  private isClientError(error: any): boolean {
    if (error.response && error.response.status) {
      return error.response.status >= 400 && error.response.status < 500;
    }
    return false;
  }

  /**
   * Extracts error message from axios error
   */
  private extractErrorMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message) {
      return error.message;
    }
    return 'Unknown error occurred';
  }

  /**
   * Extracts status code from axios error
   */
  private extractStatusCode(error: any): number | undefined {
    return error.response?.status;
  }

  /**
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check for Order Service
   */
  async healthCheck(): Promise<OrderServiceResponse> {
    try {
      const response = await this.client.get('/health');
      
      return {
        success: true,
        data: response.data,
        status_code: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: this.extractErrorMessage(error),
        status_code: this.extractStatusCode(error)
      };
    }
  }
}