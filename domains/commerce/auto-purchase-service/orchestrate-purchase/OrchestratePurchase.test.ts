/**
 * Tests para OrchestratePurchase
 * 
 * Verifica la orquestación completa del proceso de auto-compra
 */

import { OrchestratePurchase, AutoPurchaseConfig, OrderForPurchase, IExecutePurchase, IHandleConfirmation, IOrderServiceClient } from './OrchestratePurchase';
import { PurchaseResult } from '../execute-purchase/ExecutePurchase';
import { ConfirmationStatus } from '../handle-confirmation/HandleConfirmation';

describe('OrchestratePurchase', () => {
  let orchestratePurchase: OrchestratePurchase;
  let mockExecutePurchase: jest.Mocked<IExecutePurchase>;
  let mockHandleConfirmation: jest.Mocked<IHandleConfirmation>;
  let mockOrderServiceClient: jest.Mocked<IOrderServiceClient>;
  let config: AutoPurchaseConfig;

  const mockOrder: OrderForPurchase = {
    id: 1,
    user_id: 100,
    order_number: 'ORD-001',
    total_amount: 150.00,
    shipping_address: {
      street: '123 Main St',
      city: 'Madrid',
      state: 'Madrid',
      postal_code: '28001',
      country: 'ES'
    },
    items: [
      {
        product_sku: 'LAPTOP-001',
        product_name: 'Gaming Laptop',
        quantity: 1,
        unit_price: 150.00
      }
    ]
  };

  beforeEach(() => {
    config = {
      orderService: {
        baseUrl: 'http://order-service',
        timeout: 5000,
        retryAttempts: 3
      },
      enableConfirmationHandling: true,
      maxConcurrentPurchases: 5,
      purchaseTimeoutMs: 60000
    };

    mockExecutePurchase = {
      execute: jest.fn()
    };

    mockHandleConfirmation = {
      execute: jest.fn()
    };

    mockOrderServiceClient = {
      markOrderAsProcessing: jest.fn(),
      reportAutoPurchaseSuccess: jest.fn(),
      reportAutoPurchaseFailure: jest.fn(),
      updateOrderStatus: jest.fn(),
      updateTrackingInfo: jest.fn()
    };

    orchestratePurchase = new OrchestratePurchase(
      config,
      mockExecutePurchase,
      mockHandleConfirmation,
      mockOrderServiceClient
    );
  });

  describe('execute', () => {
    it('debería orquestar una compra exitosa completa', async () => {
      // Arrange
      const mockPurchaseResult: PurchaseResult = {
        success: true,
        provider_used: 'Amazon',
        provider_order_id: 'AMZ-123',
        total_cost: 165.50,
        estimated_delivery: new Date('2025-11-20'),
        fallback_attempts: 0
      };

      const mockConfirmationStatus: ConfirmationStatus = {
        provider_order_id: 'AMZ-123',
        status: 'confirmed',
        confirmation_number: 'CONF-123',
        last_updated: new Date(),
        retry_count: 1
      };

      mockOrderServiceClient.markOrderAsProcessing.mockResolvedValue({ success: true });
      mockExecutePurchase.execute.mockResolvedValue(mockPurchaseResult);
      mockHandleConfirmation.execute.mockResolvedValue(mockConfirmationStatus);
      mockOrderServiceClient.reportAutoPurchaseSuccess.mockResolvedValue({ success: true });
      mockOrderServiceClient.updateOrderStatus.mockResolvedValue({ success: true });

      // Act
      const result = await orchestratePurchase.execute(mockOrder);

      // Assert
      expect(result.success).toBe(true);
      expect(result.order_id).toBe(1);
      expect(result.provider_used).toBe('Amazon');
      expect(result.provider_order_id).toBe('AMZ-123');
      expect(result.confirmation_status).toEqual(mockConfirmationStatus);
      expect(result.total_cost).toBe(165.50);
      expect(result.processing_time_ms).toBeGreaterThan(0);

      expect(mockOrderServiceClient.markOrderAsProcessing).toHaveBeenCalledWith(1);
      expect(mockExecutePurchase.execute).toHaveBeenCalled();
      expect(mockHandleConfirmation.execute).toHaveBeenCalled();
      expect(mockOrderServiceClient.reportAutoPurchaseSuccess).toHaveBeenCalled();
      expect(mockOrderServiceClient.updateOrderStatus).toHaveBeenCalledWith(1, 'processing');
    });

    it('debería manejar orden con múltiples items', async () => {
      // Arrange
      const multiItemOrder: OrderForPurchase = {
        ...mockOrder,
        items: [
          { product_sku: 'LAPTOP-001', product_name: 'Gaming Laptop', quantity: 1, unit_price: 150.00 },
          { product_sku: 'MOUSE-001', product_name: 'Gaming Mouse', quantity: 2, unit_price: 25.00 }
        ]
      };

      const mockPurchaseResult: PurchaseResult = {
        success: true,
        provider_used: 'Amazon',
        provider_order_id: 'AMZ-123',
        total_cost: 200.00,
        estimated_delivery: new Date('2025-11-20'),
        fallback_attempts: 0
      };

      mockOrderServiceClient.markOrderAsProcessing.mockResolvedValue({ success: true });
      mockExecutePurchase.execute.mockResolvedValue(mockPurchaseResult);
      mockHandleConfirmation.execute.mockResolvedValue({
        provider_order_id: 'AMZ-123',
        status: 'confirmed',
        last_updated: new Date(),
        retry_count: 0
      });
      mockOrderServiceClient.reportAutoPurchaseSuccess.mockResolvedValue({ success: true });
      mockOrderServiceClient.updateOrderStatus.mockResolvedValue({ success: true });

      // Act
      const result = await orchestratePurchase.execute(multiItemOrder);

      // Assert
      expect(result.success).toBe(true);
      expect(mockExecutePurchase.execute).toHaveBeenCalledTimes(2);
    });

    it('debería prevenir procesamiento duplicado de la misma orden', async () => {
      // Arrange
      mockOrderServiceClient.markOrderAsProcessing.mockResolvedValue({ success: true });
      mockExecutePurchase.execute.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          provider_used: 'Amazon',
          provider_order_id: 'AMZ-123',
          total_cost: 165.50,
          estimated_delivery: new Date(),
          fallback_attempts: 0
        }), 100))
      );
      mockHandleConfirmation.execute.mockResolvedValue({
        provider_order_id: 'AMZ-123',
        status: 'confirmed',
        last_updated: new Date(),
        retry_count: 0
      });
      mockOrderServiceClient.reportAutoPurchaseSuccess.mockResolvedValue({ success: true });
      mockOrderServiceClient.updateOrderStatus.mockResolvedValue({ success: true });

      // Act
      const promise1 = orchestratePurchase.execute(mockOrder);
      const promise2 = orchestratePurchase.execute(mockOrder);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Assert
      const successResults = [result1, result2].filter(r => r.success);
      const duplicateResults = [result1, result2].filter(r => !r.success && r.error_message?.includes('already being processed'));

      expect(successResults.length).toBe(1);
      expect(duplicateResults.length).toBe(1);
    });

    it('debería manejar fallo en markOrderAsProcessing y continuar', async () => {
      // Arrange
      mockOrderServiceClient.markOrderAsProcessing.mockResolvedValue({ 
        success: false, 
        error: 'Service unavailable' 
      });
      mockExecutePurchase.execute.mockResolvedValue({
        success: true,
        provider_used: 'Amazon',
        provider_order_id: 'AMZ-123',
        total_cost: 165.50,
        estimated_delivery: new Date(),
        fallback_attempts: 0
      });
      mockHandleConfirmation.execute.mockResolvedValue({
        provider_order_id: 'AMZ-123',
        status: 'confirmed',
        last_updated: new Date(),
        retry_count: 0
      });
      mockOrderServiceClient.reportAutoPurchaseSuccess.mockResolvedValue({ success: true });
      mockOrderServiceClient.updateOrderStatus.mockResolvedValue({ success: true });

      // Act
      const result = await orchestratePurchase.execute(mockOrder);

      // Assert
      expect(result.success).toBe(true);
      expect(mockExecutePurchase.execute).toHaveBeenCalled();
    });

    it('debería manejar fallo en la compra de todos los items', async () => {
      // Arrange
      mockOrderServiceClient.markOrderAsProcessing.mockResolvedValue({ success: true });
      mockExecutePurchase.execute.mockResolvedValue({
        success: false,
        provider_used: '',
        total_cost: 0,
        estimated_delivery: new Date(),
        error_message: 'All providers failed',
        fallback_attempts: 3
      });
      mockOrderServiceClient.reportAutoPurchaseFailure.mockResolvedValue({ success: true });
      mockOrderServiceClient.updateOrderStatus.mockResolvedValue({ success: true });

      // Act
      const result = await orchestratePurchase.execute(mockOrder);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error_message).toBe('All items failed to purchase');
      expect(mockOrderServiceClient.reportAutoPurchaseFailure).toHaveBeenCalledWith(
        1,
        'All items failed to purchase',
        expect.any(Array)
      );
      expect(mockOrderServiceClient.updateOrderStatus).toHaveBeenCalledWith(1, 'cancelled');
    });

    it('debería manejar confirmación con tracking number', async () => {
      // Arrange
      const mockConfirmationWithTracking: ConfirmationStatus = {
        provider_order_id: 'AMZ-123',
        status: 'shipped',
        tracking_number: 'TRK-123456',
        estimated_delivery: new Date('2025-11-20'),
        last_updated: new Date(),
        retry_count: 1
      };

      mockOrderServiceClient.markOrderAsProcessing.mockResolvedValue({ success: true });
      mockExecutePurchase.execute.mockResolvedValue({
        success: true,
        provider_used: 'Amazon',
        provider_order_id: 'AMZ-123',
        total_cost: 165.50,
        estimated_delivery: new Date('2025-11-20'),
        fallback_attempts: 0
      });
      mockHandleConfirmation.execute.mockResolvedValue(mockConfirmationWithTracking);
      mockOrderServiceClient.updateTrackingInfo.mockResolvedValue({ success: true });
      mockOrderServiceClient.reportAutoPurchaseSuccess.mockResolvedValue({ success: true });
      mockOrderServiceClient.updateOrderStatus.mockResolvedValue({ success: true });

      // Act
      const result = await orchestratePurchase.execute(mockOrder);

      // Assert
      expect(result.success).toBe(true);
      expect(result.confirmation_status?.tracking_number).toBe('TRK-123456');
      expect(mockOrderServiceClient.updateTrackingInfo).toHaveBeenCalledWith(
        1,
        'TRK-123456',
        expect.any(Date)
      );
      expect(mockOrderServiceClient.updateOrderStatus).toHaveBeenCalledWith(1, 'shipped');
    });

    it('debería continuar si la confirmación falla pero la compra fue exitosa', async () => {
      // Arrange
      mockOrderServiceClient.markOrderAsProcessing.mockResolvedValue({ success: true });
      mockExecutePurchase.execute.mockResolvedValue({
        success: true,
        provider_used: 'Amazon',
        provider_order_id: 'AMZ-123',
        total_cost: 165.50,
        estimated_delivery: new Date(),
        fallback_attempts: 0
      });
      mockOrderServiceClient.reportAutoPurchaseSuccess.mockResolvedValue({ success: true });
      mockOrderServiceClient.updateOrderStatus.mockResolvedValue({ success: true });

      // Act
      const result = await orchestratePurchase.execute(mockOrder);

      // Assert
      expect(result.success).toBe(true);
      expect(result.confirmation_status?.status).toBe('failed');
      expect(result.confirmation_status?.error_message).toBe('Confirmation handling failed');
    });

    it('debería funcionar sin confirmación cuando está deshabilitada', async () => {
      // Arrange
      config.enableConfirmationHandling = false;
      orchestratePurchase = new OrchestratePurchase(
        config,
        mockExecutePurchase,
        mockHandleConfirmation,
        mockOrderServiceClient
      );

      mockOrderServiceClient.markOrderAsProcessing.mockResolvedValue({ success: true });
      mockExecutePurchase.execute.mockResolvedValue({
        success: true,
        provider_used: 'Amazon',
        provider_order_id: 'AMZ-123',
        total_cost: 165.50,
        estimated_delivery: new Date(),
        fallback_attempts: 0
      });
      mockOrderServiceClient.reportAutoPurchaseSuccess.mockResolvedValue({ success: true });
      mockOrderServiceClient.updateOrderStatus.mockResolvedValue({ success: true });

      // Act
      const result = await orchestratePurchase.execute(mockOrder);

      // Assert
      expect(result.success).toBe(true);
      expect(mockHandleConfirmation.execute).not.toHaveBeenCalled();
      expect(result.confirmation_status).toBeUndefined();
    });

    it('debería manejar excepciones inesperadas', async () => {
      // Arrange
      mockOrderServiceClient.markOrderAsProcessing.mockRejectedValue(new Error('Database connection failed'));
      mockOrderServiceClient.reportAutoPurchaseFailure.mockResolvedValue({ success: true });

      // Act
      const result = await orchestratePurchase.execute(mockOrder);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error_message).toBe('Database connection failed');
      expect(mockOrderServiceClient.reportAutoPurchaseFailure).toHaveBeenCalled();
    });

    it('debería limpiar activePurchases después de completar', async () => {
      // Arrange
      mockOrderServiceClient.markOrderAsProcessing.mockResolvedValue({ success: true });
      mockExecutePurchase.execute.mockResolvedValue({
        success: true,
        provider_used: 'Amazon',
        provider_order_id: 'AMZ-123',
        total_cost: 165.50,
        estimated_delivery: new Date(),
        fallback_attempts: 0
      });
      mockHandleConfirmation.execute.mockResolvedValue({
        provider_order_id: 'AMZ-123',
        status: 'confirmed',
        last_updated: new Date(),
        retry_count: 0
      });
      mockOrderServiceClient.reportAutoPurchaseSuccess.mockResolvedValue({ success: true });
      mockOrderServiceClient.updateOrderStatus.mockResolvedValue({ success: true });

      // Act
      await orchestratePurchase.execute(mockOrder);

      // Assert
      const activePurchases = orchestratePurchase.getActivePurchases();
      expect(activePurchases.has(1)).toBe(false);
    });
  });

  describe('getActivePurchases', () => {
    it('debería retornar el conjunto de compras activas', () => {
      // Act
      const activePurchases = orchestratePurchase.getActivePurchases();

      // Assert
      expect(activePurchases).toBeInstanceOf(Set);
      expect(activePurchases.size).toBe(0);
    });
  });
});
