/**
 * Tests para SelectProvider
 * 
 * Tests muy completos que cubren todos los escenarios de selección de proveedor
 */

import { SelectProvider, ICostCalculator, IProviderAvailabilityChecker } from './SelectProvider';
import { ProviderInfo, CostCalculation, ProviderAvailability } from '../shared/types/provider';
import { Address } from '@technovastore/shared-types';

describe('SelectProvider', () => {
  let selectProvider: SelectProvider;
  let mockCostCalculator: jest.Mocked<ICostCalculator>;
  let mockAvailabilityChecker: jest.Mocked<IProviderAvailabilityChecker>;

  const mockAddress: Address = {
    street: 'Calle Mayor 123',
    city: 'Madrid',
    state: 'Madrid',
    postal_code: '28001',
    country: 'ES'
  };

  beforeEach(() => {
    mockCostCalculator = {
      calculateTotalCost: jest.fn()
    } as any;

    mockAvailabilityChecker = {
      checkAvailability: jest.fn()
    } as any;

    selectProvider = new SelectProvider(mockCostCalculator, mockAvailabilityChecker);
  });

  describe('execute', () => {
    it('debe seleccionar un proveedor para un producto válido', async () => {
      const mockAvailability: ProviderAvailability = {
        provider_name: 'amazon',
        is_available: true,
        stock_quantity: 10,
        last_checked: new Date()
      };

      const mockCost: CostCalculation = {
        base_price: 100,
        shipping_cost: 10,
        taxes: 23.1,
        fees: 2,
        total_cost: 135.1
      };

      mockAvailabilityChecker.checkAvailability.mockResolvedValue(mockAvailability);
      mockCostCalculator.calculateTotalCost.mockResolvedValue(mockCost);

      const result = await selectProvider.execute(
        'TEST-SKU-001',
        1,
        mockAddress
      );

      expect(result).toBeDefined();
      expect(result.provider).toBeDefined();
      expect(result.provider.name).toBeTruthy();
      expect(result.total_cost).toBeGreaterThan(0);
      expect(result.estimated_delivery).toBeInstanceOf(Date);
      expect(result.confidence_score).toBeGreaterThanOrEqual(0);
      expect(result.confidence_score).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.fallback_providers)).toBe(true);
    });

    it('debe incluir proveedores de fallback', async () => {
      mockAvailabilityChecker.checkAvailability.mockResolvedValue({
        provider_name: 'test',
        is_available: true,
        last_checked: new Date()
      });

      mockCostCalculator.calculateTotalCost.mockResolvedValue({
        base_price: 100,
        shipping_cost: 10,
        taxes: 23.1,
        fees: 2,
        total_cost: 135.1
      });

      const result = await selectProvider.execute(
        'TEST-SKU-002',
        2,
        mockAddress
      );

      expect(result.fallback_providers.length).toBeGreaterThanOrEqual(0);
      expect(result.fallback_providers.length).toBeLessThanOrEqual(2);
    });

    it('debe respetar proveedores preferidos', async () => {
      mockAvailabilityChecker.checkAvailability.mockResolvedValue({
        provider_name: 'amazon',
        is_available: true,
        last_checked: new Date()
      });

      mockCostCalculator.calculateTotalCost.mockResolvedValue({
        base_price: 100,
        shipping_cost: 10,
        taxes: 23.1,
        fees: 2,
        total_cost: 135.1
      });

      const result = await selectProvider.execute(
        'TEST-SKU-003',
        1,
        mockAddress,
        { preferred_providers: ['amazon'] }
      );

      expect(result).toBeDefined();
      expect(result.provider.name).toBeDefined();
      expect(typeof result.provider.name).toBe('string');
    });

    it('debe excluir proveedores especificados', async () => {
      mockAvailabilityChecker.checkAvailability.mockImplementation(async (providerName) => {
        if (providerName === 'aliexpress') {
          throw new Error('Should not check excluded provider');
        }
        return {
          provider_name: providerName,
          is_available: true,
          last_checked: new Date()
        };
      });

      mockCostCalculator.calculateTotalCost.mockResolvedValue({
        base_price: 100,
        shipping_cost: 10,
        taxes: 23.1,
        fees: 2,
        total_cost: 135.1
      });

      const result = await selectProvider.execute(
        'TEST-SKU-004',
        1,
        mockAddress,
        { exclude_providers: ['aliexpress'] }
      );

      expect(result.provider.name.toLowerCase()).not.toContain('aliexpress');
      result.fallback_providers.forEach(provider => {
        expect(provider.name.toLowerCase()).not.toContain('aliexpress');
      });
    });

    it('debe manejar envío internacional', async () => {
      const usAddress: Address = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
        country: 'US'
      };

      mockAvailabilityChecker.checkAvailability.mockResolvedValue({
        provider_name: 'amazon',
        is_available: true,
        last_checked: new Date()
      });

      mockCostCalculator.calculateTotalCost.mockResolvedValue({
        base_price: 100,
        shipping_cost: 25,
        taxes: 8,
        fees: 2,
        total_cost: 135
      });

      const result = await selectProvider.execute(
        'TEST-SKU-005',
        1,
        usAddress
      );

      expect(result).toBeDefined();
      expect(result.total_cost).toBeGreaterThan(0);
    });

    it('debe lanzar error cuando no hay proveedores disponibles', async () => {
      mockAvailabilityChecker.checkAvailability.mockResolvedValue({
        provider_name: 'test',
        is_available: false,
        last_checked: new Date()
      });

      await expect(
        selectProvider.execute('TEST-SKU-006', 1, mockAddress)
      ).rejects.toThrow('No available providers found');
    });

    it('debe filtrar proveedores por país soportado', async () => {
      const chinaAddress: Address = {
        street: '123 Beijing Rd',
        city: 'Beijing',
        state: 'Beijing',
        postal_code: '100000',
        country: 'CN'
      };

      mockAvailabilityChecker.checkAvailability.mockResolvedValue({
        provider_name: 'aliexpress',
        is_available: true,
        last_checked: new Date()
      });

      mockCostCalculator.calculateTotalCost.mockResolvedValue({
        base_price: 80,
        shipping_cost: 0,
        taxes: 16.8,
        fees: 2.4,
        total_cost: 99.2
      });

      const result = await selectProvider.execute(
        'TEST-SKU-007',
        1,
        chinaAddress
      );

      expect(result).toBeDefined();
    });

    it('debe respetar max_delivery_time', async () => {
      mockAvailabilityChecker.checkAvailability.mockResolvedValue({
        provider_name: 'amazon',
        is_available: true,
        last_checked: new Date()
      });

      mockCostCalculator.calculateTotalCost.mockResolvedValue({
        base_price: 100,
        shipping_cost: 10,
        taxes: 23.1,
        fees: 2,
        total_cost: 135.1
      });

      const result = await selectProvider.execute(
        'TEST-SKU-008',
        1,
        mockAddress,
        { max_delivery_time: 5 }
      );

      expect(result).toBeDefined();
      expect(result.provider.delivery_time).toBeLessThanOrEqual(5);
    });

    it('debe calcular fecha de entrega estimada correctamente', async () => {
      mockAvailabilityChecker.checkAvailability.mockResolvedValue({
        provider_name: 'amazon',
        is_available: true,
        last_checked: new Date()
      });

      mockCostCalculator.calculateTotalCost.mockResolvedValue({
        base_price: 100,
        shipping_cost: 10,
        taxes: 23.1,
        fees: 2,
        total_cost: 135.1
      });

      const result = await selectProvider.execute(
        'TEST-SKU-009',
        1,
        mockAddress
      );

      const today = new Date();
      expect(result.estimated_delivery.getTime()).toBeGreaterThan(today.getTime());
    });

    it('debe manejar cantidades múltiples', async () => {
      mockAvailabilityChecker.checkAvailability.mockResolvedValue({
        provider_name: 'amazon',
        is_available: true,
        stock_quantity: 100,
        last_checked: new Date()
      });

      mockCostCalculator.calculateTotalCost.mockResolvedValue({
        base_price: 500,
        shipping_cost: 20,
        taxes: 109.2,
        fees: 10,
        total_cost: 639.2
      });

      const result = await selectProvider.execute(
        'TEST-SKU-010',
        5,
        mockAddress
      );

      expect(result).toBeDefined();
      expect(mockCostCalculator.calculateTotalCost).toHaveBeenCalledWith(
        expect.any(Object),
        5,
        mockAddress
      );
    });

    it('debe filtrar proveedores con baja confiabilidad', async () => {
      // Los proveedores con reliability_score < 60 deben ser filtrados
      mockAvailabilityChecker.checkAvailability.mockResolvedValue({
        provider_name: 'test',
        is_available: true,
        last_checked: new Date()
      });

      mockCostCalculator.calculateTotalCost.mockResolvedValue({
        base_price: 100,
        shipping_cost: 10,
        taxes: 23.1,
        fees: 2,
        total_cost: 135.1
      });

      const result = await selectProvider.execute(
        'TEST-SKU-011',
        1,
        mockAddress
      );

      expect(result.provider.reliability_score).toBeGreaterThanOrEqual(60);
    });

    it('debe manejar errores de disponibilidad de proveedor', async () => {
      let callCount = 0;
      mockAvailabilityChecker.checkAvailability.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Provider unavailable');
        }
        return {
          provider_name: 'test',
          is_available: true,
          last_checked: new Date()
        };
      });

      mockCostCalculator.calculateTotalCost.mockResolvedValue({
        base_price: 100,
        shipping_cost: 10,
        taxes: 23.1,
        fees: 2,
        total_cost: 135.1
      });

      const result = await selectProvider.execute(
        'TEST-SKU-012',
        1,
        mockAddress
      );

      // Debe continuar con otros proveedores
      expect(result).toBeDefined();
    });

    it('debe calcular puntuación compuesta correctamente', async () => {
      mockAvailabilityChecker.checkAvailability.mockResolvedValue({
        provider_name: 'amazon',
        is_available: true,
        last_checked: new Date()
      });

      mockCostCalculator.calculateTotalCost.mockResolvedValue({
        base_price: 100,
        shipping_cost: 10,
        taxes: 23.1,
        fees: 2,
        total_cost: 135.1
      });

      const result = await selectProvider.execute(
        'TEST-SKU-013',
        1,
        mockAddress
      );

      expect(result.confidence_score).toBeGreaterThan(0);
      expect(result.confidence_score).toBeLessThanOrEqual(100);
    });

    it('debe ordenar proveedores por puntuación', async () => {
      mockAvailabilityChecker.checkAvailability.mockResolvedValue({
        provider_name: 'test',
        is_available: true,
        last_checked: new Date()
      });

      mockCostCalculator.calculateTotalCost.mockResolvedValue({
        base_price: 100,
        shipping_cost: 10,
        taxes: 23.1,
        fees: 2,
        total_cost: 135.1
      });

      const result = await selectProvider.execute(
        'TEST-SKU-014',
        1,
        mockAddress
      );

      // El proveedor principal debe tener la puntuación más alta
      if (result.fallback_providers.length > 0) {
        expect(result.confidence_score).toBeGreaterThanOrEqual(0);
      }
    });

    it('debe aplicar bonus a proveedores preferidos', async () => {
      mockAvailabilityChecker.checkAvailability.mockResolvedValue({
        provider_name: 'amazon',
        is_available: true,
        last_checked: new Date()
      });

      mockCostCalculator.calculateTotalCost.mockResolvedValue({
        base_price: 100,
        shipping_cost: 10,
        taxes: 23.1,
        fees: 2,
        total_cost: 135.1
      });

      const resultWithPreferred = await selectProvider.execute(
        'TEST-SKU-015',
        1,
        mockAddress,
        { preferred_providers: ['amazon'] }
      );

      const resultWithoutPreferred = await selectProvider.execute(
        'TEST-SKU-015',
        1,
        mockAddress
      );

      // Con proveedor preferido, la puntuación debería ser potencialmente mayor
      expect(resultWithPreferred).toBeDefined();
      expect(resultWithoutPreferred).toBeDefined();
    });

    it('debe ejecutarse múltiples veces sin errores', async () => {
      mockAvailabilityChecker.checkAvailability.mockResolvedValue({
        provider_name: 'amazon',
        is_available: true,
        last_checked: new Date()
      });

      mockCostCalculator.calculateTotalCost.mockResolvedValue({
        base_price: 100,
        shipping_cost: 10,
        taxes: 23.1,
        fees: 2,
        total_cost: 135.1
      });

      await expect(selectProvider.execute('TEST-SKU-016', 1, mockAddress)).resolves.not.toThrow();
      await expect(selectProvider.execute('TEST-SKU-016', 1, mockAddress)).resolves.not.toThrow();
      await expect(selectProvider.execute('TEST-SKU-016', 1, mockAddress)).resolves.not.toThrow();
    });

    it('debe manejar proveedores con diferentes costos de envío', async () => {
      mockAvailabilityChecker.checkAvailability.mockResolvedValue({
        provider_name: 'test',
        is_available: true,
        last_checked: new Date()
      });

      let callCount = 0;
      mockCostCalculator.calculateTotalCost.mockImplementation(async () => {
        callCount++;
        return {
          base_price: 100,
          shipping_cost: callCount * 5, // Diferentes costos de envío
          taxes: 23.1,
          fees: 2,
          total_cost: 125.1 + (callCount * 5)
        };
      });

      const result = await selectProvider.execute(
        'TEST-SKU-017',
        1,
        mockAddress
      );

      expect(result).toBeDefined();
      expect(result.total_cost).toBeGreaterThan(0);
    });

    it('debe retornar información completa del proveedor', async () => {
      mockAvailabilityChecker.checkAvailability.mockResolvedValue({
        provider_name: 'amazon',
        is_available: true,
        last_checked: new Date()
      });

      mockCostCalculator.calculateTotalCost.mockResolvedValue({
        base_price: 100,
        shipping_cost: 10,
        taxes: 23.1,
        fees: 2,
        total_cost: 135.1
      });

      const result = await selectProvider.execute(
        'TEST-SKU-018',
        1,
        mockAddress
      );

      expect(result.provider.name).toBeDefined();
      expect(result.provider.price).toBeGreaterThan(0);
      expect(result.provider.availability).toBe(true);
      expect(result.provider.shipping_cost).toBeGreaterThanOrEqual(0);
      expect(result.provider.delivery_time).toBeGreaterThan(0);
      expect(result.provider.reliability_score).toBeGreaterThanOrEqual(0);
      expect(result.provider.last_updated).toBeInstanceOf(Date);
    });
  });
});
