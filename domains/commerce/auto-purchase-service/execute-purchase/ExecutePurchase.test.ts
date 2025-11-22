/**
 * Tests para ExecutePurchase
 * 
 * Tests muy completos que cubren todos los escenarios posibles
 */

import { ExecutePurchase, PurchaseRequest, IProviderSelector, IOrderPlacer } from './ExecutePurchase';
import { ProviderInfo } from '../shared/types/provider';
import { Address } from '@technovastore/shared-types';

describe('ExecutePurchase', () => {
  let executePurchase: ExecutePurchase;
  let mockProviderSelector: jest.Mocked<IProviderSelector>;
  let mockOrderPlacer: jest.Mocked<IOrderPlacer>;

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

  const mockFallbackProvider: ProviderInfo = {
    name: 'eBay',
    price: 105,
    availability: true,
    shipping_cost: 8,
    delivery_time: 5,
    last_updated: new Date(),
    reliability_score: 85
  };

  const mockRequest: PurchaseRequest = {
    order_id: 1,
    product_sku: 'TEST-SKU-001',
    quantity: 1,
    shipping_address: mockAddress
  };

  beforeEach(() => {
    mockProviderSelector = {
      selectBestProvider: jest.fn()
    } as any;

    mockOrderPlacer = {
      placeOrder: jest.fn()
    } as any;

    executePurchase = new ExecutePurchase(mockProviderSelector, mockOrderPlacer);
  });

  describe('execute', () => {
    it('debe ejecutar compra exitosa con proveedor principal', async () => {
      const mockSelection = {
        provider: mockProvider,
        total_cost: 120,
        estimated_delivery: new Date('2024-12-20'),
        confidence_score: 90,
        fallback_providers: [mockFallbackProvider]
      };

      const mockOrderResponse = {
        success: true,
        provider_order_id: 'AMZ-12345',
        total_cost: 120,
        estimated_delivery: new Date('2024-12-20')
      };

      mockProviderSelector.selectBestProvider.mockResolvedValue(mockSelection);
      mockOrderPlacer.placeOrder.mockResolvedValue(mockOrderResponse);

      const result = await executePurchase.execute(mockRequest);

      expect(result.success).toBe(true);
      expect(result.provider_used).toBe('Amazon');
      expect(result.provider_order_id).toBe('AMZ-12345');
      expect(result.total_cost).toBe(120);
      expect(result.estimated_delivery).toEqual(new Date('2024-12-20'));
      expect(result.fallback_attempts).toBeUndefined();
      expect(result.error_message).toBeUndefined();
    });

    it('debe usar proveedor de fallback cuando el principal falla', async () => {
      const mockSelection = {
        provider: mockProvider,
        total_cost: 120,
        estimated_delivery: new Date('2024-12-20'),
        confidence_score: 90,
        fallback_providers: [mockFallbackProvider]
      };

      const mockFallbackSelection = {
        provider: mockFallbackProvider,
        total_cost: 125,
        estimated_delivery: new Date('2024-12-22'),
        confidence_score: 85,
        fallback_providers: []
      };

      // Primera llamada para proveedor principal
      mockProviderSelector.selectBestProvider
        .mockResolvedValueOnce(mockSelection)
        // Segunda llamada para fallback
        .mockResolvedValueOnce(mockFallbackSelection);

      // Proveedor principal falla
      mockOrderPlacer.placeOrder
        .mockResolvedValueOnce({
          success: false,
          error_code: 'INSUFFICIENT_INVENTORY',
          error_message: 'Product out of stock'
        })
        // Fallback tiene éxito
        .mockResolvedValueOnce({
          success: true,
          provider_order_id: 'EBAY-67890',
          total_cost: 125,
          estimated_delivery: new Date('2024-12-22')
        });

      const result = await executePurchase.execute(mockRequest);

      expect(result.success).toBe(true);
      expect(result.provider_used).toBe('eBay');
      expect(result.provider_order_id).toBe('EBAY-67890');
      expect(result.total_cost).toBe(125);
      expect(result.fallback_attempts).toBe(1);
    });

    it('debe fallar cuando todos los proveedores fallan', async () => {
      const mockSelection = {
        provider: mockProvider,
        total_cost: 120,
        estimated_delivery: new Date('2024-12-20'),
        confidence_score: 90,
        fallback_providers: [mockFallbackProvider]
      };

      mockProviderSelector.selectBestProvider.mockResolvedValue(mockSelection);

      // Todos los proveedores fallan
      mockOrderPlacer.placeOrder.mockResolvedValue({
        success: false,
        error_code: 'INSUFFICIENT_INVENTORY',
        error_message: 'Product out of stock'
      });

      const result = await executePurchase.execute(mockRequest);

      expect(result.success).toBe(false);
      expect(result.provider_used).toBe('none');
      expect(result.total_cost).toBe(0);
      expect(result.error_message).toBe('All providers failed to process the purchase');
      expect(result.fallback_attempts).toBe(1);
    });

    it('debe manejar múltiples proveedores de fallback', async () => {
      const mockFallbackProvider2: ProviderInfo = {
        name: 'Newegg',
        price: 110,
        availability: true,
        shipping_cost: 12,
        delivery_time: 4,
        last_updated: new Date(),
        reliability_score: 88
      };

      const mockSelection = {
        provider: mockProvider,
        total_cost: 120,
        estimated_delivery: new Date('2024-12-20'),
        confidence_score: 90,
        fallback_providers: [mockFallbackProvider, mockFallbackProvider2]
      };

      const mockFallbackSelection2 = {
        provider: mockFallbackProvider2,
        total_cost: 130,
        estimated_delivery: new Date('2024-12-21'),
        confidence_score: 88,
        fallback_providers: []
      };

      mockProviderSelector.selectBestProvider
        .mockResolvedValueOnce(mockSelection)
        .mockResolvedValueOnce(mockFallbackSelection2);

      // Principal y primer fallback fallan, segundo fallback tiene éxito
      mockOrderPlacer.placeOrder
        .mockResolvedValueOnce({ success: false, error_message: 'Failed' })
        .mockResolvedValueOnce({ success: false, error_message: 'Failed' })
        .mockResolvedValueOnce({
          success: true,
          provider_order_id: 'NWG-11111',
          total_cost: 130,
          estimated_delivery: new Date('2024-12-21')
        });

      const result = await executePurchase.execute(mockRequest);

      expect(result.success).toBe(true);
      expect(result.provider_used).toBe('Newegg');
      expect(result.fallback_attempts).toBe(2);
    });

    it('debe manejar errores de selección de proveedor', async () => {
      mockProviderSelector.selectBestProvider.mockRejectedValue(
        new Error('No available providers')
      );

      const result = await executePurchase.execute(mockRequest);

      expect(result.success).toBe(false);
      expect(result.provider_used).toBe('none');
      expect(result.error_message).toBe('No available providers');
    });

    it('debe manejar errores de colocación de orden', async () => {
      const mockSelection = {
        provider: mockProvider,
        total_cost: 120,
        estimated_delivery: new Date('2024-12-20'),
        confidence_score: 90,
        fallback_providers: []
      };

      mockProviderSelector.selectBestProvider.mockResolvedValue(mockSelection);
      mockOrderPlacer.placeOrder.mockRejectedValue(new Error('Network error'));

      const result = await executePurchase.execute(mockRequest);

      expect(result.success).toBe(false);
      expect(result.provider_used).toBe('none');
      expect(result.error_message).toContain('All providers failed');
    });

    it('debe respetar max_delivery_time en la solicitud', async () => {
      const requestWithMaxDelivery: PurchaseRequest = {
        ...mockRequest,
        max_delivery_time: 5
      };

      const mockSelection = {
        provider: mockProvider,
        total_cost: 120,
        estimated_delivery: new Date('2024-12-20'),
        confidence_score: 90,
        fallback_providers: []
      };

      mockProviderSelector.selectBestProvider.mockResolvedValue(mockSelection);
      mockOrderPlacer.placeOrder.mockResolvedValue({
        success: true,
        provider_order_id: 'AMZ-12345',
        total_cost: 120,
        estimated_delivery: new Date('2024-12-20')
      });

      await executePurchase.execute(requestWithMaxDelivery);

      expect(mockProviderSelector.selectBestProvider).toHaveBeenCalledWith(
        requestWithMaxDelivery.product_sku,
        requestWithMaxDelivery.quantity,
        requestWithMaxDelivery.shipping_address,
        expect.objectContaining({
          max_delivery_time: 5
        })
      );
    });

    it('debe respetar preferred_providers en la solicitud', async () => {
      const requestWithPreferred: PurchaseRequest = {
        ...mockRequest,
        preferred_providers: ['amazon', 'ebay']
      };

      const mockSelection = {
        provider: mockProvider,
        total_cost: 120,
        estimated_delivery: new Date('2024-12-20'),
        confidence_score: 90,
        fallback_providers: []
      };

      mockProviderSelector.selectBestProvider.mockResolvedValue(mockSelection);
      mockOrderPlacer.placeOrder.mockResolvedValue({
        success: true,
        provider_order_id: 'AMZ-12345',
        total_cost: 120,
        estimated_delivery: new Date('2024-12-20')
      });

      await executePurchase.execute(requestWithPreferred);

      expect(mockProviderSelector.selectBestProvider).toHaveBeenCalledWith(
        requestWithPreferred.product_sku,
        requestWithPreferred.quantity,
        requestWithPreferred.shipping_address,
        expect.objectContaining({
          preferred_providers: ['amazon', 'ebay']
        })
      );
    });

    it('debe manejar cantidades múltiples correctamente', async () => {
      const requestWithQuantity: PurchaseRequest = {
        ...mockRequest,
        quantity: 5
      };

      const mockSelection = {
        provider: mockProvider,
        total_cost: 600,
        estimated_delivery: new Date('2024-12-20'),
        confidence_score: 90,
        fallback_providers: []
      };

      mockProviderSelector.selectBestProvider.mockResolvedValue(mockSelection);
      mockOrderPlacer.placeOrder.mockResolvedValue({
        success: true,
        provider_order_id: 'AMZ-12345',
        total_cost: 600,
        estimated_delivery: new Date('2024-12-20')
      });

      const result = await executePurchase.execute(requestWithQuantity);

      expect(result.success).toBe(true);
      expect(result.total_cost).toBe(600);
      expect(mockProviderSelector.selectBestProvider).toHaveBeenCalledWith(
        requestWithQuantity.product_sku,
        5,
        requestWithQuantity.shipping_address,
        expect.any(Object)
      );
    });

    it('debe manejar direcciones internacionales', async () => {
      const internationalAddress: Address = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
        country: 'US'
      };

      const requestInternational: PurchaseRequest = {
        ...mockRequest,
        shipping_address: internationalAddress
      };

      const mockSelection = {
        provider: mockProvider,
        total_cost: 150,
        estimated_delivery: new Date('2024-12-25'),
        confidence_score: 85,
        fallback_providers: []
      };

      mockProviderSelector.selectBestProvider.mockResolvedValue(mockSelection);
      mockOrderPlacer.placeOrder.mockResolvedValue({
        success: true,
        provider_order_id: 'AMZ-12345',
        total_cost: 150,
        estimated_delivery: new Date('2024-12-25')
      });

      const result = await executePurchase.execute(requestInternational);

      expect(result.success).toBe(true);
      expect(result.total_cost).toBe(150);
    });

    it('debe llamar al selector de proveedor exactamente una vez para compra exitosa', async () => {
      const mockSelection = {
        provider: mockProvider,
        total_cost: 120,
        estimated_delivery: new Date('2024-12-20'),
        confidence_score: 90,
        fallback_providers: []
      };

      mockProviderSelector.selectBestProvider.mockResolvedValue(mockSelection);
      mockOrderPlacer.placeOrder.mockResolvedValue({
        success: true,
        provider_order_id: 'AMZ-12345',
        total_cost: 120,
        estimated_delivery: new Date('2024-12-20')
      });

      await executePurchase.execute(mockRequest);

      expect(mockProviderSelector.selectBestProvider).toHaveBeenCalledTimes(1);
    });

    it('debe llamar al order placer para cada intento de proveedor', async () => {
      const mockSelection = {
        provider: mockProvider,
        total_cost: 120,
        estimated_delivery: new Date('2024-12-20'),
        confidence_score: 90,
        fallback_providers: [mockFallbackProvider]
      };

      mockProviderSelector.selectBestProvider.mockResolvedValue(mockSelection);
      mockOrderPlacer.placeOrder
        .mockResolvedValueOnce({ success: false, error_message: 'Failed' })
        .mockResolvedValueOnce({ success: false, error_message: 'Failed' });

      await executePurchase.execute(mockRequest);

      expect(mockOrderPlacer.placeOrder).toHaveBeenCalledTimes(2);
    });

    it('debe manejar respuestas sin provider_order_id', async () => {
      const mockSelection = {
        provider: mockProvider,
        total_cost: 120,
        estimated_delivery: new Date('2024-12-20'),
        confidence_score: 90,
        fallback_providers: []
      };

      mockProviderSelector.selectBestProvider.mockResolvedValue(mockSelection);
      mockOrderPlacer.placeOrder.mockResolvedValue({
        success: true,
        total_cost: 120,
        estimated_delivery: new Date('2024-12-20')
        // Sin provider_order_id
      });

      const result = await executePurchase.execute(mockRequest);

      expect(result.success).toBe(true);
      expect(result.provider_order_id).toBeUndefined();
    });

    it('debe manejar respuestas sin total_cost', async () => {
      const mockSelection = {
        provider: mockProvider,
        total_cost: 120,
        estimated_delivery: new Date('2024-12-20'),
        confidence_score: 90,
        fallback_providers: []
      };

      mockProviderSelector.selectBestProvider.mockResolvedValue(mockSelection);
      mockOrderPlacer.placeOrder.mockResolvedValue({
        success: true,
        provider_order_id: 'AMZ-12345',
        estimated_delivery: new Date('2024-12-20')
        // Sin total_cost
      });

      const result = await executePurchase.execute(mockRequest);

      expect(result.success).toBe(true);
      expect(result.total_cost).toBe(120); // Usa el del selection
    });

    it('debe ejecutarse múltiples veces sin errores', async () => {
      const mockSelection = {
        provider: mockProvider,
        total_cost: 120,
        estimated_delivery: new Date('2024-12-20'),
        confidence_score: 90,
        fallback_providers: []
      };

      mockProviderSelector.selectBestProvider.mockResolvedValue(mockSelection);
      mockOrderPlacer.placeOrder.mockResolvedValue({
        success: true,
        provider_order_id: 'AMZ-12345',
        total_cost: 120,
        estimated_delivery: new Date('2024-12-20')
      });

      await expect(executePurchase.execute(mockRequest)).resolves.not.toThrow();
      await expect(executePurchase.execute(mockRequest)).resolves.not.toThrow();
      await expect(executePurchase.execute(mockRequest)).resolves.not.toThrow();
    });

    it('debe manejar errores no estándar', async () => {
      mockProviderSelector.selectBestProvider.mockRejectedValue('String error');

      const result = await executePurchase.execute(mockRequest);

      expect(result.success).toBe(false);
      expect(result.error_message).toBe('Unknown error occurred');
    });

    it('debe incluir información de fallback en resultado exitoso', async () => {
      const mockSelection = {
        provider: mockProvider,
        total_cost: 120,
        estimated_delivery: new Date('2024-12-20'),
        confidence_score: 90,
        fallback_providers: [mockFallbackProvider]
      };

      const mockFallbackSelection = {
        provider: mockFallbackProvider,
        total_cost: 125,
        estimated_delivery: new Date('2024-12-22'),
        confidence_score: 85,
        fallback_providers: []
      };

      mockProviderSelector.selectBestProvider
        .mockResolvedValueOnce(mockSelection)
        .mockResolvedValueOnce(mockFallbackSelection);

      mockOrderPlacer.placeOrder
        .mockResolvedValueOnce({ success: false, error_message: 'Failed' })
        .mockResolvedValueOnce({
          success: true,
          provider_order_id: 'EBAY-67890',
          total_cost: 125,
          estimated_delivery: new Date('2024-12-22')
        });

      const result = await executePurchase.execute(mockRequest);

      expect(result.success).toBe(true);
      expect(result.fallback_attempts).toBeDefined();
      expect(result.fallback_attempts).toBeGreaterThan(0);
    });
  });
});
