/**
 * Tests para CalculateCost
 * 
 * Tests muy completos que cubren todos los escenarios de cálculo de costos
 */

import { CalculateCost } from './CalculateCost';
import { ProviderInfo } from '../shared/types/provider';
import { Address } from '@technovastore/shared-types';

describe('CalculateCost', () => {
  let calculateCost: CalculateCost;
  
  const mockProvider: ProviderInfo = {
    name: 'Amazon',
    price: 100,
    availability: true,
    shipping_cost: 10,
    delivery_time: 3,
    last_updated: new Date(),
    reliability_score: 95
  };

  const mockAddress: Address = {
    street: 'Calle Mayor 123',
    city: 'Madrid',
    state: 'Madrid',
    postal_code: '28001',
    country: 'ES'
  };

  beforeEach(() => {
    calculateCost = new CalculateCost();
  });

  describe('execute', () => {
    it('debe calcular costo total correctamente', async () => {
      const result = await calculateCost.execute(
        mockProvider,
        1,
        mockAddress
      );

      expect(result).toBeDefined();
      expect(result.base_price).toBe(100);
      expect(result.shipping_cost).toBeGreaterThan(0);
      expect(result.taxes).toBeGreaterThan(0);
      expect(result.fees).toBeGreaterThan(0);
      expect(result.total_cost).toBeGreaterThan(result.base_price);
    });

    it('debe aplicar multiplicador de cantidad al precio base', async () => {
      const singleResult = await calculateCost.execute(
        mockProvider,
        1,
        mockAddress
      );

      const doubleResult = await calculateCost.execute(
        mockProvider,
        2,
        mockAddress
      );

      expect(doubleResult.base_price).toBe(singleResult.base_price * 2);
    });

    it('debe calcular costos diferentes para diferentes países', async () => {
      const esResult = await calculateCost.execute(
        mockProvider,
        1,
        mockAddress
      );

      const usAddress: Address = {
        ...mockAddress,
        country: 'US'
      };

      const usResult = await calculateCost.execute(
        mockProvider,
        1,
        usAddress
      );

      // Los costos deberían ser diferentes debido a diferentes tasas de impuestos y envío
      expect(esResult.total_cost).not.toBe(usResult.total_cost);
    });

    it('debe incluir fees de procesamiento', async () => {
      const result = await calculateCost.execute(
        mockProvider,
        1,
        mockAddress
      );

      expect(result.fees).toBeGreaterThan(0);
      expect(result.fees).toBe(mockProvider.price * 0.02); // 2% para Amazon
    });

    it('debe calcular impuestos correctamente para España (21%)', async () => {
      const result = await calculateCost.execute(
        mockProvider,
        1,
        mockAddress
      );

      const subtotal = result.base_price + result.shipping_cost;
      const expectedTaxes = Math.round(subtotal * 0.21 * 100) / 100;

      expect(result.taxes).toBe(expectedTaxes);
    });

    it('debe aplicar costo de envío adicional para cantidades múltiples', async () => {
      const singleResult = await calculateCost.execute(
        mockProvider,
        1,
        mockAddress
      );

      const multipleResult = await calculateCost.execute(
        mockProvider,
        3,
        mockAddress
      );

      // El envío para 3 items debería ser mayor que para 1, pero no 3x
      expect(multipleResult.shipping_cost).toBeGreaterThan(singleResult.shipping_cost);
      expect(multipleResult.shipping_cost).toBeLessThan(singleResult.shipping_cost * 3);
    });

    it('debe aplicar premium por envío express', async () => {
      const expressProvider: ProviderInfo = {
        ...mockProvider,
        delivery_time: 1 // Entrega en 1 día
      };

      const standardProvider: ProviderInfo = {
        ...mockProvider,
        delivery_time: 5 // Entrega en 5 días
      };

      const expressResult = await calculateCost.execute(expressProvider, 1, mockAddress);
      const standardResult = await calculateCost.execute(standardProvider, 1, mockAddress);

      // El envío express debería ser más caro
      expect(expressResult.shipping_cost).toBeGreaterThan(standardResult.shipping_cost);
    });

    it('debe aplicar multiplicador de distancia para envío internacional', async () => {
      // Proveedor local en España
      const localProvider = {
        ...mockProvider,
        name: 'Local Supplier'
      };

      const localResult = await calculateCost.execute(
        localProvider,
        1,
        mockAddress // ES
      );

      const internationalAddress: Address = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
        country: 'US'
      };

      const internationalResult = await calculateCost.execute(
        localProvider,
        1,
        internationalAddress // US desde ES
      );

      // El envío internacional debería ser más caro
      expect(internationalResult.shipping_cost).toBeGreaterThan(localResult.shipping_cost);
    });

    it('debe usar tasa de impuestos por defecto para país desconocido', async () => {
      const unknownCountryAddress: Address = {
        ...mockAddress,
        country: 'XX' // País desconocido
      };

      const result = await calculateCost.execute(
        mockProvider,
        1,
        unknownCountryAddress
      );

      const subtotal = result.base_price + result.shipping_cost;
      const expectedTaxes = Math.round(subtotal * 0.20 * 100) / 100; // 20% por defecto

      expect(result.taxes).toBe(expectedTaxes);
    });

    it('debe calcular fees diferentes para diferentes proveedores', async () => {
      const providers: ProviderInfo[] = [
        { ...mockProvider, name: 'Amazon' },      // 2%
        { ...mockProvider, name: 'AliExpress' },  // 3%
        { ...mockProvider, name: 'eBay' },        // 2.5%
        { ...mockProvider, name: 'Local Supplier' } // 1%
      ];

      const results = await Promise.all(
        providers.map(p => calculateCost.execute(p, 1, mockAddress))
      );

      // Los fees deberían ser diferentes
      const fees = results.map(r => r.fees);
      const uniqueFees = new Set(fees);
      expect(uniqueFees.size).toBeGreaterThan(1);
    });

    it('debe redondear valores a 2 decimales', async () => {
      const result = await calculateCost.execute(
        mockProvider,
        1,
        mockAddress
      );

      // Verificar que todos los valores tienen máximo 2 decimales
      // Usar toFixed para evitar problemas de precisión de punto flotante
      expect(Number(result.base_price.toFixed(2))).toBe(result.base_price);
      expect(Number(result.shipping_cost.toFixed(2))).toBe(result.shipping_cost);
      expect(Number(result.taxes.toFixed(2))).toBe(result.taxes);
      expect(Number(result.fees.toFixed(2))).toBe(result.fees);
      expect(Number(result.total_cost.toFixed(2))).toBe(result.total_cost);
    });

    it('debe calcular costo total como suma de todos los componentes', async () => {
      const result = await calculateCost.execute(
        mockProvider,
        1,
        mockAddress
      );

      const expectedTotal = result.base_price + result.shipping_cost + result.taxes + result.fees;
      
      // Permitir pequeña diferencia por redondeo
      expect(Math.abs(result.total_cost - expectedTotal)).toBeLessThan(0.01);
    });

    it('debe manejar cantidades grandes', async () => {
      const result = await calculateCost.execute(
        mockProvider,
        100,
        mockAddress
      );

      expect(result.base_price).toBe(mockProvider.price * 100);
      expect(result.total_cost).toBeGreaterThan(result.base_price);
    });

    it('debe aplicar multiplicador correcto para envío dentro de la UE', async () => {
      const frenchAddress: Address = {
        street: '123 Rue de Paris',
        city: 'Paris',
        state: 'Ile-de-France',
        postal_code: '75001',
        country: 'FR'
      };

      const localSupplier: ProviderInfo = {
        ...mockProvider,
        name: 'Local Supplier' // Ubicado en ES
      };

      const result = await calculateCost.execute(
        localSupplier,
        1,
        frenchAddress
      );

      // Envío dentro de la UE debería tener multiplicador de 1.2
      expect(result.shipping_cost).toBeGreaterThan(localSupplier.shipping_cost);
    });

    it('debe calcular impuestos para diferentes países de la UE', async () => {
      const countries = [
        { country: 'ES', rate: 0.21 },
        { country: 'FR', rate: 0.20 },
        { country: 'DE', rate: 0.19 },
        { country: 'IT', rate: 0.22 },
        { country: 'PT', rate: 0.23 }
      ];

      for (const { country, rate } of countries) {
        const address: Address = { ...mockAddress, country };
        const result = await calculateCost.execute(mockProvider, 1, address);
        
        const subtotal = result.base_price + result.shipping_cost;
        const expectedTaxes = Math.round(subtotal * rate * 100) / 100;
        
        expect(result.taxes).toBe(expectedTaxes);
      }
    });

    it('debe ejecutarse múltiples veces sin errores', async () => {
      await expect(calculateCost.execute(mockProvider, 1, mockAddress)).resolves.not.toThrow();
      await expect(calculateCost.execute(mockProvider, 1, mockAddress)).resolves.not.toThrow();
      await expect(calculateCost.execute(mockProvider, 1, mockAddress)).resolves.not.toThrow();
    });
  });

  describe('compareCosts', () => {
    it('debe comparar costos entre proveedores', async () => {
      const providers: ProviderInfo[] = [
        { ...mockProvider, name: 'Amazon', price: 100 },
        { ...mockProvider, name: 'AliExpress', price: 80 },
        { ...mockProvider, name: 'eBay', price: 95 }
      ];

      const comparisons = await calculateCost.compareCosts(
        providers,
        1,
        mockAddress
      );

      expect(comparisons).toHaveLength(3);
      expect(comparisons[0].cost.total_cost).toBeLessThanOrEqual(comparisons[1].cost.total_cost);
      expect(comparisons[1].cost.total_cost).toBeLessThanOrEqual(comparisons[2].cost.total_cost);
    });

    it('debe ordenar proveedores por costo total', async () => {
      const providers: ProviderInfo[] = [
        { ...mockProvider, name: 'Expensive', price: 200 },
        { ...mockProvider, name: 'Cheap', price: 50 },
        { ...mockProvider, name: 'Medium', price: 100 }
      ];

      const comparisons = await calculateCost.compareCosts(
        providers,
        1,
        mockAddress
      );

      // El más barato debería estar primero
      expect(comparisons[0].provider.name).toBe('Cheap');
      expect(comparisons[2].provider.name).toBe('Expensive');
    });

    it('debe incluir información completa de costo para cada proveedor', async () => {
      const providers: ProviderInfo[] = [
        { ...mockProvider, name: 'Amazon' },
        { ...mockProvider, name: 'eBay' }
      ];

      const comparisons = await calculateCost.compareCosts(
        providers,
        1,
        mockAddress
      );

      comparisons.forEach(comparison => {
        expect(comparison.provider).toBeDefined();
        expect(comparison.cost.base_price).toBeGreaterThan(0);
        expect(comparison.cost.shipping_cost).toBeGreaterThanOrEqual(0);
        expect(comparison.cost.taxes).toBeGreaterThanOrEqual(0);
        expect(comparison.cost.fees).toBeGreaterThanOrEqual(0);
        expect(comparison.cost.total_cost).toBeGreaterThan(0);
      });
    });

    it('debe manejar lista vacía de proveedores', async () => {
      const comparisons = await calculateCost.compareCosts(
        [],
        1,
        mockAddress
      );

      expect(comparisons).toHaveLength(0);
    });

    it('debe manejar un solo proveedor', async () => {
      const comparisons = await calculateCost.compareCosts(
        [mockProvider],
        1,
        mockAddress
      );

      expect(comparisons).toHaveLength(1);
      expect(comparisons[0].provider).toBe(mockProvider);
    });
  });

  describe('calculateSavings', () => {
    it('debe calcular ahorros correctamente', async () => {
      const providers: ProviderInfo[] = [
        { ...mockProvider, name: 'Cheap', price: 80 },
        { ...mockProvider, name: 'Expensive', price: 120 }
      ];

      const comparisons = await calculateCost.compareCosts(
        providers,
        1,
        mockAddress
      );

      const savings = calculateCost.calculateSavings(comparisons);

      expect(savings).toBeGreaterThan(0);
      expect(savings).toBe(
        comparisons[1].cost.total_cost - comparisons[0].cost.total_cost
      );
    });

    it('debe retornar 0 para lista con menos de 2 proveedores', () => {
      const savings = calculateCost.calculateSavings([]);
      expect(savings).toBe(0);
    });

    it('debe retornar 0 cuando solo hay un proveedor', async () => {
      const comparisons = await calculateCost.compareCosts(
        [mockProvider],
        1,
        mockAddress
      );

      const savings = calculateCost.calculateSavings(comparisons);
      expect(savings).toBe(0);
    });

    it('debe calcular ahorros significativos con proveedores muy diferentes', async () => {
      const providers: ProviderInfo[] = [
        { ...mockProvider, name: 'Very Cheap', price: 50, shipping_cost: 0 },
        { ...mockProvider, name: 'Very Expensive', price: 200, shipping_cost: 50 }
      ];

      const comparisons = await calculateCost.compareCosts(
        providers,
        1,
        mockAddress
      );

      const savings = calculateCost.calculateSavings(comparisons);

      // Los ahorros deberían ser sustanciales
      expect(savings).toBeGreaterThan(100);
    });
  });
});
