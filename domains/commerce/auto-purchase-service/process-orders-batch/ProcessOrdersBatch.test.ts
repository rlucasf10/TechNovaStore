/**
 * Tests para ProcessOrdersBatch
 * 
 * Verifica el procesamiento de múltiples órdenes en lotes
 */

import { ProcessOrdersBatch, IOrchestratePurchase } from './ProcessOrdersBatch';
import { OrderForPurchase, PurchaseOrchestrationResult } from '../orchestrate-purchase/OrchestratePurchase';

describe('ProcessOrdersBatch', () => {
  let processOrdersBatch: ProcessOrdersBatch;
  let mockOrchestratePurchase: jest.Mocked<IOrchestratePurchase>;

  const createMockOrder = (id: number): OrderForPurchase => ({
    id,
    user_id: 100 + id,
    order_number: `ORD-${id.toString().padStart(3, '0')}`,
    total_amount: 100.00 + id,
    shipping_address: {
      street: `${id} Main St`,
      city: 'Madrid',
      state: 'Madrid',
      postal_code: '28001',
      country: 'ES'
    },
    items: [
      {
        product_sku: `PRODUCT-${id}`,
        product_name: `Product ${id}`,
        quantity: 1,
        unit_price: 100.00 + id
      }
    ]
  });

  beforeEach(() => {
    mockOrchestratePurchase = {
      execute: jest.fn()
    };

    processOrdersBatch = new ProcessOrdersBatch(5, mockOrchestratePurchase);
  });

  describe('execute', () => {
    it('debería procesar un lote vacío', async () => {
      // Act
      const results = await processOrdersBatch.execute([]);

      // Assert
      expect(results).toEqual([]);
      expect(mockOrchestratePurchase.execute).not.toHaveBeenCalled();
    });

    it('debería procesar una sola orden', async () => {
      // Arrange
      const orders = [createMockOrder(1)];
      const mockResult: PurchaseOrchestrationResult = {
        success: true,
        order_id: 1,
        provider_used: 'Amazon',
        provider_order_id: 'AMZ-123',
        total_cost: 110.00,
        estimated_delivery: new Date(),
        processing_time_ms: 1000
      };

      mockOrchestratePurchase.execute.mockResolvedValue(mockResult);

      // Act
      const results = await processOrdersBatch.execute(orders);

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(mockResult);
      expect(mockOrchestratePurchase.execute).toHaveBeenCalledTimes(1);
      expect(mockOrchestratePurchase.execute).toHaveBeenCalledWith(orders[0]);
    });

    it('debería procesar múltiples órdenes dentro del límite de concurrencia', async () => {
      // Arrange
      const orders = [createMockOrder(1), createMockOrder(2), createMockOrder(3)];
      
      mockOrchestratePurchase.execute.mockImplementation((order) => 
        Promise.resolve({
          success: true,
          order_id: order.id,
          provider_used: 'Amazon',
          provider_order_id: `AMZ-${order.id}`,
          total_cost: 110.00,
          estimated_delivery: new Date(),
          processing_time_ms: 1000
        })
      );

      // Act
      const results = await processOrdersBatch.execute(orders);

      // Assert
      expect(results).toHaveLength(3);
      expect(mockOrchestratePurchase.execute).toHaveBeenCalledTimes(3);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('debería procesar órdenes en lotes respetando maxConcurrent', async () => {
      // Arrange
      const orders = Array.from({ length: 12 }, (_, i) => createMockOrder(i + 1));
      
      mockOrchestratePurchase.execute.mockImplementation((order) => 
        Promise.resolve({
          success: true,
          order_id: order.id,
          provider_used: 'Amazon',
          provider_order_id: `AMZ-${order.id}`,
          total_cost: 110.00,
          estimated_delivery: new Date(),
          processing_time_ms: 1000
        })
      );

      // Act
      const results = await processOrdersBatch.execute(orders);

      // Assert
      expect(results).toHaveLength(12);
      expect(mockOrchestratePurchase.execute).toHaveBeenCalledTimes(12);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('debería manejar errores individuales sin detener el lote', async () => {
      // Arrange
      const orders = [createMockOrder(1), createMockOrder(2), createMockOrder(3)];
      
      mockOrchestratePurchase.execute.mockImplementation((order) => {
        if (order.id === 2) {
          return Promise.reject(new Error('Processing failed'));
        }
        return Promise.resolve({
          success: true,
          order_id: order.id,
          provider_used: 'Amazon',
          provider_order_id: `AMZ-${order.id}`,
          total_cost: 110.00,
          estimated_delivery: new Date(),
          processing_time_ms: 1000
        });
      });

      // Act
      const results = await processOrdersBatch.execute(orders);

      // Assert
      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error_message).toBe('Processing failed');
      expect(results[2].success).toBe(true);
    });

    it('debería retornar resultados en el mismo orden que las órdenes', async () => {
      // Arrange
      const orders = [createMockOrder(5), createMockOrder(3), createMockOrder(1)];
      
      mockOrchestratePurchase.execute.mockImplementation((order) => 
        Promise.resolve({
          success: true,
          order_id: order.id,
          provider_used: 'Amazon',
          provider_order_id: `AMZ-${order.id}`,
          total_cost: 110.00,
          estimated_delivery: new Date(),
          processing_time_ms: 1000
        })
      );

      // Act
      const results = await processOrdersBatch.execute(orders);

      // Assert
      expect(results[0].order_id).toBe(5);
      expect(results[1].order_id).toBe(3);
      expect(results[2].order_id).toBe(1);
    });

    it('debería procesar lotes grandes correctamente', async () => {
      // Arrange
      const orders = Array.from({ length: 25 }, (_, i) => createMockOrder(i + 1));
      
      mockOrchestratePurchase.execute.mockImplementation((order) => 
        Promise.resolve({
          success: true,
          order_id: order.id,
          provider_used: 'Amazon',
          provider_order_id: `AMZ-${order.id}`,
          total_cost: 110.00,
          estimated_delivery: new Date(),
          processing_time_ms: 1000
        })
      );

      // Act
      const results = await processOrdersBatch.execute(orders);

      // Assert
      expect(results).toHaveLength(25);
      expect(mockOrchestratePurchase.execute).toHaveBeenCalledTimes(25);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('debería manejar mezcla de éxitos y fallos', async () => {
      // Arrange
      const orders = Array.from({ length: 10 }, (_, i) => createMockOrder(i + 1));
      
      mockOrchestratePurchase.execute.mockImplementation((order) => {
        if (order.id % 3 === 0) {
          return Promise.resolve({
            success: false,
            order_id: order.id,
            error_message: 'Provider unavailable',
            processing_time_ms: 500
          });
        }
        return Promise.resolve({
          success: true,
          order_id: order.id,
          provider_used: 'Amazon',
          provider_order_id: `AMZ-${order.id}`,
          total_cost: 110.00,
          estimated_delivery: new Date(),
          processing_time_ms: 1000
        });
      });

      // Act
      const results = await processOrdersBatch.execute(orders);

      // Assert
      expect(results).toHaveLength(10);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      expect(successCount).toBe(7); // IDs: 1,2,4,5,7,8,10
      expect(failCount).toBe(3);    // IDs: 3,6,9
    });

    it('debería respetar maxConcurrent de 1', async () => {
      // Arrange
      processOrdersBatch = new ProcessOrdersBatch(1, mockOrchestratePurchase);
      const orders = [createMockOrder(1), createMockOrder(2), createMockOrder(3)];
      
      const executionOrder: number[] = [];
      mockOrchestratePurchase.execute.mockImplementation((order) => {
        executionOrder.push(order.id);
        return Promise.resolve({
          success: true,
          order_id: order.id,
          provider_used: 'Amazon',
          provider_order_id: `AMZ-${order.id}`,
          total_cost: 110.00,
          estimated_delivery: new Date(),
          processing_time_ms: 1000
        });
      });

      // Act
      const results = await processOrdersBatch.execute(orders);

      // Assert
      expect(results).toHaveLength(3);
      expect(executionOrder).toEqual([1, 2, 3]);
    });

    it('debería agregar delay entre lotes', async () => {
      // Arrange
      const orders = Array.from({ length: 8 }, (_, i) => createMockOrder(i + 1));
      const startTime = Date.now();
      
      mockOrchestratePurchase.execute.mockImplementation((order) => 
        Promise.resolve({
          success: true,
          order_id: order.id,
          provider_used: 'Amazon',
          provider_order_id: `AMZ-${order.id}`,
          total_cost: 110.00,
          estimated_delivery: new Date(),
          processing_time_ms: 100
        })
      );

      // Act
      await processOrdersBatch.execute(orders);

      // Assert
      const duration = Date.now() - startTime;
      
      // Con maxConcurrent=5, 8 órdenes requieren 2 lotes
      // Debe haber al menos 1 delay de 1000ms entre lotes
      expect(duration).toBeGreaterThanOrEqual(1000);
    });

    it('debería manejar todas las órdenes fallando', async () => {
      // Arrange
      const orders = [createMockOrder(1), createMockOrder(2), createMockOrder(3)];
      
      mockOrchestratePurchase.execute.mockResolvedValue({
        success: false,
        order_id: 1,
        error_message: 'All providers failed',
        processing_time_ms: 500
      });

      // Act
      const results = await processOrdersBatch.execute(orders);

      // Assert
      expect(results).toHaveLength(3);
      expect(results.every(r => !r.success)).toBe(true);
    });

    it('debería manejar excepciones no capturadas', async () => {
      // Arrange
      const orders = [createMockOrder(1), createMockOrder(2)];
      
      mockOrchestratePurchase.execute.mockImplementation((order) => {
        if (order.id === 1) {
          return Promise.reject(new Error('Unexpected error'));
        }
        return Promise.resolve({
          success: true,
          order_id: order.id,
          provider_used: 'Amazon',
          provider_order_id: `AMZ-${order.id}`,
          total_cost: 110.00,
          estimated_delivery: new Date(),
          processing_time_ms: 1000
        });
      });

      // Act
      const results = await processOrdersBatch.execute(orders);

      // Assert
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[0].error_message).toBe('Unexpected error');
      expect(results[1].success).toBe(true);
    });

    it('debería procesar órdenes concurrentemente dentro de cada lote', async () => {
      // Arrange
      const orders = [createMockOrder(1), createMockOrder(2), createMockOrder(3)];
      const executionTimes: number[] = [];
      
      mockOrchestratePurchase.execute.mockImplementation(async (order) => {
        executionTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          success: true,
          order_id: order.id,
          provider_used: 'Amazon',
          provider_order_id: `AMZ-${order.id}`,
          total_cost: 110.00,
          estimated_delivery: new Date(),
          processing_time_ms: 100
        };
      });

      // Act
      const startTime = Date.now();
      await processOrdersBatch.execute(orders);
      const totalTime = Date.now() - startTime;

      // Assert
      // Si fueran secuenciales, tomaría ~300ms
      // Al ser concurrentes, debe tomar ~100ms
      expect(totalTime).toBeLessThan(200);
      
      // Todas las ejecuciones deben comenzar casi al mismo tiempo
      const maxTimeDiff = Math.max(...executionTimes) - Math.min(...executionTimes);
      expect(maxTimeDiff).toBeLessThan(50);
    });
  });
});
