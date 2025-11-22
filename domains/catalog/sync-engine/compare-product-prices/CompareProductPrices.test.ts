/**
 * Tests para CompareProductPrices
 */

import { CompareProductPrices } from './CompareProductPrices';
import { PriceComparator } from '../shared/pricing/PriceComparator';
import { PriceComparison, ProviderPrice } from '../shared/types/pricing';

describe('CompareProductPrices', () => {
  let compareProductPrices: CompareProductPrices;
  let mockPriceComparator: jest.Mocked<PriceComparator>;

  beforeEach(() => {
    mockPriceComparator = {
      compareProductPrices: jest.fn(),
    } as any;

    compareProductPrices = new CompareProductPrices(mockPriceComparator);
  });

  describe('execute', () => {
    const mockProviders: ProviderPrice[] = [
      {
        provider: 'amazon',
        price: 100,
        shipping_cost: 0,
        total_cost: 100,
        currency: 'USD',
        availability: true,
        delivery_time: 2,
        last_updated: new Date(),
        url: 'https://amazon.com/product',
      },
      {
        provider: 'ebay',
        price: 95,
        shipping_cost: 5,
        total_cost: 100,
        currency: 'USD',
        availability: true,
        delivery_time: 3,
        last_updated: new Date(),
        url: 'https://ebay.com/product',
      },
    ];

    const mockResult: PriceComparison = {
      sku: 'TEST-001',
      product_name: 'Test Product',
      providers: mockProviders,
      best_price: mockProviders[1],
      our_price: 110,
      markup_percentage: 15,
      savings: 10,
      last_updated: new Date(),
    };

    it('debe comparar precios correctamente con SKU y nombre válidos', async () => {
      mockPriceComparator.compareProductPrices.mockResolvedValue(mockResult);

      const result = await compareProductPrices.execute('TEST-001', 'Test Product');

      expect(result).toEqual(mockResult);
      expect(mockPriceComparator.compareProductPrices).toHaveBeenCalledWith('TEST-001', 'Test Product');
    });

    it('debe lanzar error si no se proporciona SKU', async () => {
      await expect(compareProductPrices.execute('', 'Test Product')).rejects.toThrow(
        'SKU and product name are required'
      );
    });

    it('debe lanzar error si no se proporciona nombre de producto', async () => {
      await expect(compareProductPrices.execute('TEST-001', '')).rejects.toThrow(
        'SKU and product name are required'
      );
    });

    it('debe lanzar error si ambos parámetros están vacíos', async () => {
      await expect(compareProductPrices.execute('', '')).rejects.toThrow(
        'SKU and product name are required'
      );
    });

    it('debe manejar resultado con múltiples proveedores', async () => {
      const multiProviders: ProviderPrice[] = [
        { ...mockProviders[0], provider: 'amazon' },
        { ...mockProviders[1], provider: 'ebay' },
        { ...mockProviders[0], provider: 'newegg', price: 98 },
        { ...mockProviders[1], provider: 'aliexpress', price: 90 },
      ];

      const multiProviderResult: PriceComparison = {
        ...mockResult,
        providers: multiProviders,
      };

      mockPriceComparator.compareProductPrices.mockResolvedValue(multiProviderResult);

      const result = await compareProductPrices.execute('TEST-001', 'Test Product');

      expect(result.providers).toHaveLength(4);
      expect(result).toEqual(multiProviderResult);
    });

    it('debe manejar resultado sin precios disponibles', async () => {
      const noPricesResult: PriceComparison = {
        ...mockResult,
        providers: [],
      };

      mockPriceComparator.compareProductPrices.mockResolvedValue(noPricesResult);

      const result = await compareProductPrices.execute('TEST-001', 'Test Product');

      expect(result.providers).toHaveLength(0);
    });

    it('debe propagar errores del price comparator', async () => {
      const error = new Error('Price comparison failed');
      mockPriceComparator.compareProductPrices.mockRejectedValue(error);

      await expect(compareProductPrices.execute('TEST-001', 'Test Product')).rejects.toThrow(
        'Price comparison failed'
      );
    });

    it('debe manejar productos con caracteres especiales en el nombre', async () => {
      mockPriceComparator.compareProductPrices.mockResolvedValue(mockResult);

      await compareProductPrices.execute('TEST-001', 'Product with "quotes" & special chars');

      expect(mockPriceComparator.compareProductPrices).toHaveBeenCalledWith(
        'TEST-001',
        'Product with "quotes" & special chars'
      );
    });

    it('debe manejar SKUs con diferentes formatos', async () => {
      mockPriceComparator.compareProductPrices.mockResolvedValue(mockResult);

      await compareProductPrices.execute('SKU-123-ABC', 'Test Product');

      expect(mockPriceComparator.compareProductPrices).toHaveBeenCalledWith('SKU-123-ABC', 'Test Product');
    });

    it('debe retornar timestamp actualizado', async () => {
      const now = new Date();
      const resultWithTimestamp = { ...mockResult, last_updated: now };
      mockPriceComparator.compareProductPrices.mockResolvedValue(resultWithTimestamp);

      const result = await compareProductPrices.execute('TEST-001', 'Test Product');

      expect(result.last_updated).toEqual(now);
    });

    it('debe llamar al comparator exactamente una vez', async () => {
      mockPriceComparator.compareProductPrices.mockResolvedValue(mockResult);

      await compareProductPrices.execute('TEST-001', 'Test Product');

      expect(mockPriceComparator.compareProductPrices).toHaveBeenCalledTimes(1);
    });

    it('debe manejar precios con diferentes monedas', async () => {
      const multiCurrencyProviders: ProviderPrice[] = [
        { ...mockProviders[0], currency: 'USD' },
        { ...mockProviders[1], currency: 'EUR', price: 85 },
      ];

      const multiCurrencyResult: PriceComparison = {
        ...mockResult,
        providers: multiCurrencyProviders,
      };

      mockPriceComparator.compareProductPrices.mockResolvedValue(multiCurrencyResult);

      const result = await compareProductPrices.execute('TEST-001', 'Test Product');

      expect(result.providers[0].currency).toBe('USD');
      expect(result.providers[1].currency).toBe('EUR');
    });

    it('debe manejar productos no disponibles', async () => {
      const unavailableProviders: ProviderPrice[] = [
        { ...mockProviders[0], availability: false },
        { ...mockProviders[1], availability: true },
      ];

      const unavailableResult: PriceComparison = {
        ...mockResult,
        providers: unavailableProviders,
      };

      mockPriceComparator.compareProductPrices.mockResolvedValue(unavailableResult);

      const result = await compareProductPrices.execute('TEST-001', 'Test Product');

      expect(result.providers[0].availability).toBe(false);
      expect(result.providers[1].availability).toBe(true);
    });
  });
});
