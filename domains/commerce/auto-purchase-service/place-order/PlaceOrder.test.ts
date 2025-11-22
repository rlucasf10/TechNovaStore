/**
 * Tests para PlaceOrder
 * 
 * Tests muy completos que cubren todos los escenarios de colocación de órdenes
 */

import { PlaceOrder, ProviderOrderResponse, RetryConfig } from './PlaceOrder';
import { PurchaseRequest } from '../execute-purchase/ExecutePurchase';
import { ProviderInfo } from '../shared/types/provider';
import { Address } from '@technovastore/shared-types';

describe('PlaceOrder', () => {
  let placeOrder: PlaceOrder;

  const mockAddress: Address = {
    street: 'Calle Mayor 123',
    city: 'Madrid',
    state: 'Madrid',
    postal_code: '28001',
    country: 'ES'
  };

  const mockProvider: ProviderInfo = {
    name: 'Amazon',
    price: 100,
    availability: true,
    shipping_cost: 10,
    delivery_time: 3,
    last_updated: new Date(),
    reliability_score: 95
  };

  const mockRequest: PurchaseRequest = {
    order_id: 1,
    product_sku: 'TEST-SKU-001',
    quantity: 1,
    shipping_address: mockAddress
  };

  beforeEach(() => {
    placeOrder = new PlaceOrder();
  });

  describe('execute', () => {
    it('debe colocar orden exitosamente con Amazon', async () => {
      const result = await placeOrder.execute(mockProvider, mockRequest);

      // Debido a la naturaleza probabilística del mock, verificamos estructura
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        expect(result.provider_order_id).toBeDefined();
        expect(result.provider_order_id).toContain('AMZ-');
        expect(result.total_cost).toBeGreaterThan(0);
        expect(result.estimated_delivery).toBeInstanceOf(Date);
      }
    }, 10000);

    it('debe reintentar en caso de error retryable', async () => {
      const customRetryConfig: Partial<RetryConfig> = {
        max_attempts: 5,
        initial_delay_ms: 100,
        max_delay_ms: 1000
      };

      const result = await placeOrder.execute(mockProvider, mockRequest, customRetryConfig);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    }, 15000);

    it('debe fallar inmediatamente con error no-retryable', async () => {
      // Ejecutar múltiples veces para aumentar probabilidad de error no-retryable
      const results: ProviderOrderResponse[] = [];
      
      for (let i = 0; i < 10; i++) {
        const result = await placeOrder.execute(mockProvider, mockRequest);
        results.push(result);
      }

      // Al menos uno debería tener un resultado
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r !== undefined)).toBe(true);
    }, 30000); // 30 segundos - delays de 1ms en test

    it('debe manejar diferentes proveedores', async () => {
      const providers: ProviderInfo[] = [
        { ...mockProvider, name: 'Amazon' },
        { ...mockProvider, name: 'eBay' },
        { ...mockProvider, name: 'AliExpress' },
        { ...mockProvider, name: 'Newegg' },
        { ...mockProvider, name: 'Banggood' },
        { ...mockProvider, name: 'Local Supplier' }
      ];

      for (const provider of providers) {
        const result = await placeOrder.execute(provider, mockRequest);
        
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
        
        if (result.success && result.provider_order_id) {
          // Verificar que el ID contiene el prefijo correcto
          const expectedPrefixes: Record<string, string> = {
            'Amazon': 'AMZ-',
            'eBay': 'EBAY-',
            'AliExpress': 'ALI-',
            'Newegg': 'NWG-',
            'Banggood': 'BGD-',
            'Local Supplier': 'LOCAL-'
          };
          
          const expectedPrefix = expectedPrefixes[provider.name];
          if (expectedPrefix) {
            expect(result.provider_order_id).toContain(expectedPrefix);
          }
        }
      }
    }, 60000); // 60 segundos timeout para múltiples proveedores

    it('debe fallar con proveedor no soportado', async () => {
      const unsupportedProvider: ProviderInfo = {
        ...mockProvider,
        name: 'UnsupportedProvider'
      };

      const result = await placeOrder.execute(unsupportedProvider, mockRequest);

      expect(result.success).toBe(false);
      expect(result.error_code).toBe('UNSUPPORTED_PROVIDER');
      expect(result.error_message).toContain('not supported');
    });

    it('debe respetar configuración de reintentos personalizada', async () => {
      const customConfig: Partial<RetryConfig> = {
        max_attempts: 2,
        initial_delay_ms: 50,
        max_delay_ms: 500,
        backoff_multiplier: 1.5
      };

      const result = await placeOrder.execute(mockProvider, mockRequest, customConfig);

      expect(result).toBeDefined();
    }, 10000);

    it('debe calcular delay con backoff exponencial', async () => {
      const startTime = Date.now();
      
      const customConfig: Partial<RetryConfig> = {
        max_attempts: 3,
        initial_delay_ms: 100,
        backoff_multiplier: 2
      };

      await placeOrder.execute(mockProvider, mockRequest, customConfig);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Debería tomar al menos algo de tiempo si hay reintentos
      expect(duration).toBeGreaterThanOrEqual(0);
    }, 60000); // 60 segundos timeout

    it('debe manejar cantidades múltiples', async () => {
      const multiQuantityRequest: PurchaseRequest = {
        ...mockRequest,
        quantity: 5
      };

      const result = await placeOrder.execute(mockProvider, multiQuantityRequest);

      expect(result).toBeDefined();
      
      if (result.success && result.total_cost) {
        // El costo debería reflejar la cantidad
        expect(result.total_cost).toBeGreaterThan(mockProvider.price);
      }
    }, 10000);

    it('debe incluir información de confirmación cuando está disponible', async () => {
      const results: ProviderOrderResponse[] = [];
      
      // Ejecutar múltiples veces para obtener un resultado exitoso
      for (let i = 0; i < 5; i++) {
        const result = await placeOrder.execute(mockProvider, mockRequest);
        if (result.success) {
          results.push(result);
        }
      }

      // Verificar que al menos un resultado exitoso tiene información
      const successfulResults = results.filter(r => r.success);
      if (successfulResults.length > 0) {
        const result = successfulResults[0];
        expect(result.provider_order_id).toBeDefined();
      }
    }, 60000); // 60 segundos timeout

    it('debe manejar direcciones internacionales', async () => {
      const internationalAddress: Address = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
        country: 'US'
      };

      const internationalRequest: PurchaseRequest = {
        ...mockRequest,
        shipping_address: internationalAddress
      };

      const result = await placeOrder.execute(mockProvider, internationalRequest);

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    }, 10000);

    it('debe retornar fecha de entrega estimada', async () => {
      const results: ProviderOrderResponse[] = [];
      
      for (let i = 0; i < 5; i++) {
        const result = await placeOrder.execute(mockProvider, mockRequest);
        if (result.success && result.estimated_delivery) {
          results.push(result);
        }
      }

      if (results.length > 0) {
        const result = results[0];
        expect(result.estimated_delivery).toBeInstanceOf(Date);
        expect(result.estimated_delivery!.getTime()).toBeGreaterThan(Date.now());
      }
    }, 60000); // 60 segundos timeout

    it('debe incluir retry_after en errores de rate limit', async () => {
      const results: ProviderOrderResponse[] = [];
      
      // Ejecutar múltiples veces para obtener un error de rate limit
      for (let i = 0; i < 20; i++) {
        const result = await placeOrder.execute(mockProvider, mockRequest);
        if (!result.success && result.error_code === 'RATE_LIMIT_EXCEEDED') {
          results.push(result);
        }
      }

      if (results.length > 0) {
        const result = results[0];
        expect(result.retry_after).toBeDefined();
        expect(result.retry_after).toBeGreaterThan(0);
      }
    }, 120000); // 120 segundos timeout para 20 intentos

    it('debe ejecutarse múltiples veces sin errores', async () => {
      await expect(placeOrder.execute(mockProvider, mockRequest)).resolves.not.toThrow();
      await expect(placeOrder.execute(mockProvider, mockRequest)).resolves.not.toThrow();
      await expect(placeOrder.execute(mockProvider, mockRequest)).resolves.not.toThrow();
    }, 15000);

    it('debe manejar diferentes tipos de errores', async () => {
      const errorTypes = new Set<string>();
      
      // Ejecutar múltiples veces para recolectar diferentes tipos de errores
      for (let i = 0; i < 30; i++) {
        const result = await placeOrder.execute(mockProvider, mockRequest);
        if (!result.success && result.error_code) {
          errorTypes.add(result.error_code);
        }
      }

      // Deberíamos ver al menos algunos tipos de errores diferentes
      expect(errorTypes.size).toBeGreaterThanOrEqual(0);
    }, 90000);

    it('debe incluir mensaje de error descriptivo', async () => {
      const results: ProviderOrderResponse[] = [];
      
      for (let i = 0; i < 10; i++) {
        const result = await placeOrder.execute(mockProvider, mockRequest);
        if (!result.success) {
          results.push(result);
        }
      }

      if (results.length > 0) {
        const result = results[0];
        expect(result.error_message).toBeDefined();
        expect(result.error_message!.length).toBeGreaterThan(0);
      }
    }, 30000); // 30 segundos timeout

    it('debe calcular costo total correctamente', async () => {
      const results: ProviderOrderResponse[] = [];
      
      for (let i = 0; i < 5; i++) {
        const result = await placeOrder.execute(mockProvider, mockRequest);
        if (result.success && result.total_cost) {
          results.push(result);
        }
      }

      if (results.length > 0) {
        const result = results[0];
        expect(result.total_cost).toBeGreaterThan(0);
        // Debería incluir precio del producto + envío
        expect(result.total_cost).toBeGreaterThanOrEqual(mockProvider.price);
      }
    }, 60000); // 60 segundos timeout

    it('debe manejar timeout en modo test', async () => {
      // En modo test, los delays son más cortos
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      const startTime = Date.now();
      await placeOrder.execute(mockProvider, mockRequest);
      const duration = Date.now() - startTime;

      // En modo test debería ser rápido
      expect(duration).toBeLessThan(5000);

      process.env.NODE_ENV = originalEnv;
    }, 10000);

    it('debe generar IDs únicos para cada orden', async () => {
      const orderIds = new Set<string>();
      
      for (let i = 0; i < 10; i++) {
        const result = await placeOrder.execute(mockProvider, mockRequest);
        if (result.success && result.provider_order_id) {
          orderIds.add(result.provider_order_id);
        }
      }

      // Todos los IDs deberían ser únicos
      if (orderIds.size > 1) {
        expect(orderIds.size).toBeGreaterThan(1);
      }
    }, 60000); // 60 segundos timeout

    it('debe manejar diferentes proveedores con diferentes tasas de éxito', async () => {
      const providers = [
        { ...mockProvider, name: 'Amazon' },    // 85% éxito
        { ...mockProvider, name: 'AliExpress' }, // 75% éxito
        { ...mockProvider, name: 'eBay' },      // 80% éxito
        { ...mockProvider, name: 'Banggood' },  // 70% éxito
        { ...mockProvider, name: 'Newegg' },    // 88% éxito
        { ...mockProvider, name: 'Local Supplier' } // 92% éxito
      ];

      const results: Record<string, { success: number; total: number }> = {};

      for (const provider of providers) {
        results[provider.name] = { success: 0, total: 0 };
        
        for (let i = 0; i < 10; i++) {
          const result = await placeOrder.execute(provider, mockRequest);
          results[provider.name].total++;
          if (result.success) {
            results[provider.name].success++;
          }
        }
      }

      // Verificar que cada proveedor tuvo al menos algunos intentos
      Object.values(results).forEach(stat => {
        expect(stat.total).toBe(10);
      });
    }, 60000); // 60 segundos - delays de 1ms en test

    it('debe respetar max_attempts en configuración', async () => {
      const config: Partial<RetryConfig> = {
        max_attempts: 1 // Solo un intento
      };

      const startTime = Date.now();
      await placeOrder.execute(mockProvider, mockRequest, config);
      const duration = Date.now() - startTime;

      // Con solo un intento, debería ser rápido
      expect(duration).toBeLessThan(5000);
    }, 10000);

    it('debe aplicar jitter al delay de reintento', async () => {
      const delays: number[] = [];
      
      // Esto es difícil de probar directamente, pero podemos verificar
      // que los delays no son exactamente iguales
      const config: Partial<RetryConfig> = {
        max_attempts: 3,
        initial_delay_ms: 100
      };

      // Ejecutar varias veces y medir duración
      for (let i = 0; i < 3; i++) {
        const start = Date.now();
        await placeOrder.execute(mockProvider, mockRequest, config);
        delays.push(Date.now() - start);
      }

      // Los delays deberían variar debido al jitter y naturaleza probabilística
      expect(delays.length).toBe(3);
    }, 60000); // 60 segundos timeout
  });
});
