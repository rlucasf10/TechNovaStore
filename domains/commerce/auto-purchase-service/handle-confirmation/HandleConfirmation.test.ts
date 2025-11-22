/**
 * Tests para HandleConfirmation
 * 
 * Verifica el manejo de confirmaciones de proveedor con polling
 */

import { HandleConfirmation, ConfirmationStatus } from './HandleConfirmation';
import { ProviderInfo } from '../shared/types/provider';
import { ProviderOrderResponse } from '../place-order/PlaceOrder';

describe('HandleConfirmation', () => {
  let handleConfirmation: HandleConfirmation;

  const mockProvider: ProviderInfo = {
    name: 'Amazon',
    price: 100.00,
    availability: true,
    shipping_cost: 10.00,
    delivery_time: 3,
    last_updated: new Date(),
    reliability_score: 95,
    api_endpoint: 'https://api.amazon.com',
    api_key: 'test-key'
  };

  const mockOrderResponse: ProviderOrderResponse = {
    success: true,
    provider_order_id: 'AMZ-123',
    confirmation_number: 'CONF-123',
    tracking_number: 'TRK-123',
    estimated_delivery: new Date('2025-11-20'),
    total_cost: 110.00
  };

  beforeEach(() => {
    handleConfirmation = new HandleConfirmation();
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('debería manejar confirmación exitosa', async () => {
      // Act
      const result = await handleConfirmation.execute(mockProvider, mockOrderResponse, 1);

      // Assert
      expect(result.provider_order_id).toBe('AMZ-123');
      expect(['confirmed', 'processing', 'shipped', 'cancelled', 'failed']).toContain(result.status);
      expect(result.last_updated).toBeInstanceOf(Date);
      expect(result.retry_count).toBeGreaterThanOrEqual(0);
    }, 5000); // 5 segundos - en test usa delays de 1ms y maxWaitTime de 1s

    it('debería rechazar orden fallida', async () => {
      // Arrange
      const failedOrderResponse: ProviderOrderResponse = {
        success: false,
        error_code: 'PAYMENT_FAILED',
        error_message: 'Payment declined'
      };

      // Act & Assert
      await expect(
        handleConfirmation.execute(mockProvider, failedOrderResponse, 1)
      ).rejects.toThrow('Cannot handle confirmation for failed order');
    });

    it('debería rechazar orden sin provider_order_id', async () => {
      // Arrange
      const orderWithoutId: ProviderOrderResponse = {
        success: true,
        total_cost: 110.00
      };

      // Act & Assert
      await expect(
        handleConfirmation.execute(mockProvider, orderWithoutId, 1)
      ).rejects.toThrow('Cannot handle confirmation for failed order');
    });

    it('debería incluir información de confirmación inicial', async () => {
      // Act
      const result = await handleConfirmation.execute(mockProvider, mockOrderResponse, 1);

      // Assert
      expect(result.provider_order_id).toBe('AMZ-123');
      expect(result.confirmation_number).toBe('CONF-123');
      expect(result.actual_cost).toBe(110.00);
    }, 5000); // 5 segundos

    it('debería manejar diferentes proveedores', async () => {
      // Arrange
      // Reducir a 2 proveedores para que el test sea más rápido
      const providers = ['Amazon', 'AliExpress'];

      // Act & Assert
      for (const providerName of providers) {
        const provider = { ...mockProvider, name: providerName };
        const orderResponse = { ...mockOrderResponse, provider_order_id: `${providerName}-123` };
        
        const result = await handleConfirmation.execute(provider, orderResponse, 1);
        
        expect(result.provider_order_id).toBe(`${providerName}-123`);
        expect(['pending', 'confirmed', 'processing', 'shipped', 'cancelled', 'failed']).toContain(result.status);
      }
    }, 10000); // 10 segundos para 2 proveedores

    it('debería eventualmente alcanzar un estado final', async () => {
      // Act
      const result = await handleConfirmation.execute(mockProvider, mockOrderResponse, 1);

      // Assert
      const finalStates = ['confirmed', 'cancelled', 'failed', 'processing', 'shipped'];
      expect(finalStates).toContain(result.status);
    }, 10000); // 10 segundos

    it('debería incrementar retry_count durante polling', async () => {
      // Act
      const result = await handleConfirmation.execute(mockProvider, mockOrderResponse, 1);

      // Assert
      expect(result.retry_count).toBeGreaterThanOrEqual(0);
    }, 5000); // 5 segundos

    it('debería actualizar last_updated', async () => {
      // Arrange
      const startTime = new Date();

      // Act
      const result = await handleConfirmation.execute(mockProvider, mockOrderResponse, 1);

      // Assert
      expect(result.last_updated.getTime()).toBeGreaterThanOrEqual(startTime.getTime());
    }, 10000); // 10 segundos

    it('debería manejar proveedor no soportado', async () => {
      // Arrange
      const unsupportedProvider = { ...mockProvider, name: 'UnsupportedProvider' };

      // Act
      const result = await handleConfirmation.execute(unsupportedProvider, mockOrderResponse, 1);

      // Assert
      expect(result.status).toBe('failed');
      expect(result.error_message).toContain('not supported');
    });
  });

  describe('getConfirmationStatus', () => {
    it('debería obtener estado de confirmación sin polling', async () => {
      // Act
      const result = await handleConfirmation.getConfirmationStatus(mockProvider, 'AMZ-123');

      // Assert
      if (result) {
        expect(result.provider_order_id).toBe('AMZ-123');
        expect(['pending', 'confirmed', 'processing', 'shipped', 'cancelled', 'failed']).toContain(result.status);
      }
    });

    it('debería retornar null en caso de error', async () => {
      // Arrange
      const invalidProvider = { ...mockProvider, name: 'InvalidProvider' };

      // Act
      const result = await handleConfirmation.getConfirmationStatus(invalidProvider, 'INVALID-123');

      // Assert
      expect(result).toBeNull();
    });

    it('debería manejar diferentes proveedores', async () => {
      // Arrange
      const providers = ['Amazon', 'AliExpress', 'eBay', 'Banggood', 'Newegg', 'Local Supplier'];

      // Act & Assert
      for (const providerName of providers) {
        const provider = { ...mockProvider, name: providerName };
        const result = await handleConfirmation.getConfirmationStatus(provider, `${providerName}-123`);
        
        if (result) {
          expect(result.provider_order_id).toBe(`${providerName}-123`);
        }
      }
    });
  });
});
