import { OrderServiceClient, OrderServiceResponse, OrderUpdateData } from '../orderServiceClient';

export class MockOrderServiceClient extends OrderServiceClient {
  constructor() {
    super({
      baseUrl: 'http://mock-service',
      timeout: 1000,
      retryAttempts: 1
    });
  }

  override async updateOrderStatus(orderId: number, status: string): Promise<OrderServiceResponse> {
    return {
      success: true,
      data: { orderId, status },
      status_code: 200
    };
  }

  override async updateOrderWithProviderInfo(orderId: number, updateData: OrderUpdateData): Promise<OrderServiceResponse> {
    return {
      success: true,
      data: { orderId, ...updateData },
      status_code: 200
    };
  }

  override async markOrderAsProcessing(orderId: number): Promise<OrderServiceResponse> {
    return {
      success: true,
      data: { orderId, status: 'processing' },
      status_code: 200
    };
  }

  override async updateTrackingInfo(orderId: number, trackingNumber: string, estimatedDelivery?: Date): Promise<OrderServiceResponse> {
    return {
      success: true,
      data: { orderId, trackingNumber, estimatedDelivery },
      status_code: 200
    };
  }

  override async getOrder(orderId: number): Promise<OrderServiceResponse> {
    return {
      success: true,
      data: { id: orderId, status: 'confirmed' },
      status_code: 200
    };
  }

  override async getOrdersForAutoPurchase(): Promise<OrderServiceResponse> {
    return {
      success: true,
      data: [],
      status_code: 200
    };
  }

  override async reportAutoPurchaseFailure(orderId: number, errorMessage: string, providerAttempts: string[]): Promise<OrderServiceResponse> {
    return {
      success: true,
      data: { orderId, errorMessage, providerAttempts },
      status_code: 200
    };
  }

  override async reportAutoPurchaseSuccess(orderId: number, providerOrderId: string, providerName: string, totalCost: number, estimatedDelivery: Date): Promise<OrderServiceResponse> {
    return {
      success: true,
      data: { orderId, providerOrderId, providerName, totalCost, estimatedDelivery },
      status_code: 200
    };
  }

  override async healthCheck(): Promise<OrderServiceResponse> {
    return {
      success: true,
      data: { status: 'healthy' },
      status_code: 200
    };
  }
}