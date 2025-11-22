/**
 * Tests para UpdateDynamicPrice
 */

import { UpdateDynamicPrice, DynamicPriceUpdateResult } from './UpdateDynamicPrice';
import { DynamicPricingEngine } from '../shared/pricing/DynamicPricingEngine';

describe('UpdateDynamicPrice', () => {
  let updateDynamicPrice: UpdateDynamicPrice;
  let mockDynamicPricingEngine: jest.Mocked<DynamicPricingEngine>;

  beforeEach(() => {
    mockDynamicPricingEngine = {
      updateProductPrice: jest.fn(),
    } as any;

    updateDynamicPrice = new UpdateDynamicPrice(mockDynamicPricingEngine);
  });

  describe('execute', () => {
    const mockEngineResult = {
      oldPrice: 100,
      newPrice: 95,
      changed: true,
      reason: 'Competitor price decreased',
    };

    it('debe actualizar precio dinámico correctamente', async () => {
      mockDynamicPricingEngine.updateProductPrice.mockResolvedValue(mockEngineResult);

      const result = await updateDynamicPrice.execute('TEST-001', 'Test Product');

      expect(result.sku).toBe('TEST-001');
      expect(result.productName).toBe('Test Product');
      expect(result.oldPrice).toBe(100);
      expect(result.newPrice).toBe(95);
      expect(result.priceChange).toBe(-5);
      expect(result.priceChangePercentage).toBe(-5);
      expect(result.changed).toBe(true);
      expect(result.reason).toBe('Competitor price decreased');
      expect(result.appliedAt).toBeInstanceOf(Date);
      expect(mockDynamicPricingEngine.updateProductPrice).toHaveBeenCalledWith('TEST-001', 'Test Product');
    });

    it('debe lanzar error si no se proporciona SKU', async () => {
      await expect(updateDynamicPrice.execute('', 'Test Product')).rejects.toThrow(
        'SKU and product name are required'
      );
    });

    it('debe lanzar error si no se proporciona nombre de producto', async () => {
      await expect(updateDynamicPrice.execute('TEST-001', '')).rejects.toThrow(
        'SKU and product name are required'
      );
    });

    it('debe lanzar error si ambos parámetros están vacíos', async () => {
      await expect(updateDynamicPrice.execute('', '')).rejects.toThrow(
        'SKU and product name are required'
      );
    });

    it('debe manejar aumento de precio', async () => {
      const priceIncreaseResult = {
        oldPrice: 100,
        newPrice: 110,
        changed: true,
        reason: 'High demand',
      };

      mockDynamicPricingEngine.updateProductPrice.mockResolvedValue(priceIncreaseResult);

      const result = await updateDynamicPrice.execute('TEST-001', 'Test Product');

      expect(result.priceChange).toBeGreaterThan(0);
      expect(result.newPrice).toBeGreaterThan(result.oldPrice);
      expect(result.priceChangePercentage).toBe(10);
    });

    it('debe manejar disminución de precio', async () => {
      const priceDecreaseResult = {
        oldPrice: 100,
        newPrice: 90,
        changed: true,
        reason: 'Low demand',
      };

      mockDynamicPricingEngine.updateProductPrice.mockResolvedValue(priceDecreaseResult);

      const result = await updateDynamicPrice.execute('TEST-001', 'Test Product');

      expect(result.priceChange).toBeLessThan(0);
      expect(result.newPrice).toBeLessThan(result.oldPrice);
      expect(result.priceChangePercentage).toBe(-10);
    });

    it('debe manejar precio sin cambios', async () => {
      const noChangeResult = {
        oldPrice: 100,
        newPrice: 100,
        changed: false,
        reason: 'Price already optimal',
      };

      mockDynamicPricingEngine.updateProductPrice.mockResolvedValue(noChangeResult);

      const result = await updateDynamicPrice.execute('TEST-001', 'Test Product');

      expect(result.priceChange).toBe(0);
      expect(result.newPrice).toBe(result.oldPrice);
      expect(result.changed).toBe(false);
    });

    it('debe manejar producto con precio inicial en 0', async () => {
      const newProductResult = {
        oldPrice: 0,
        newPrice: 100,
        changed: true,
        reason: 'Initial price set',
      };

      mockDynamicPricingEngine.updateProductPrice.mockResolvedValue(newProductResult);

      const result = await updateDynamicPrice.execute('TEST-001', 'Test Product');

      expect(result.oldPrice).toBe(0);
      expect(result.priceChange).toBe(100);
      expect(result.priceChangePercentage).toBe(0); // División por 0 manejada
    });

    it('debe propagar errores del pricing engine', async () => {
      const error = new Error('Pricing engine error');
      mockDynamicPricingEngine.updateProductPrice.mockRejectedValue(error);

      await expect(updateDynamicPrice.execute('TEST-001', 'Test Product')).rejects.toThrow(
        'Pricing engine error'
      );
    });

    it('debe manejar diferentes razones de cambio de precio', async () => {
      const reasons = [
        'Competitor price decreased',
        'High demand',
        'Low inventory',
        'Market analysis',
        'Seasonal adjustment',
      ];

      for (const reason of reasons) {
        const reasonResult = {
          oldPrice: 100,
          newPrice: 95,
          changed: true,
          reason,
        };

        mockDynamicPricingEngine.updateProductPrice.mockResolvedValue(reasonResult);

        const result = await updateDynamicPrice.execute('TEST-001', 'Test Product');

        expect(result.reason).toBe(reason);
      }
    });

    it('debe retornar timestamp de aplicación', async () => {
      mockDynamicPricingEngine.updateProductPrice.mockResolvedValue(mockEngineResult);

      const before = new Date();
      const result = await updateDynamicPrice.execute('TEST-001', 'Test Product');
      const after = new Date();

      expect(result.appliedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.appliedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('debe llamar al pricing engine exactamente una vez', async () => {
      mockDynamicPricingEngine.updateProductPrice.mockResolvedValue(mockEngineResult);

      await updateDynamicPrice.execute('TEST-001', 'Test Product');

      expect(mockDynamicPricingEngine.updateProductPrice).toHaveBeenCalledTimes(1);
    });

    it('debe manejar cambios de precio pequeños', async () => {
      const smallChangeResult = {
        oldPrice: 100,
        newPrice: 100.5,
        changed: true,
        reason: 'Minor adjustment',
      };

      mockDynamicPricingEngine.updateProductPrice.mockResolvedValue(smallChangeResult);

      const result = await updateDynamicPrice.execute('TEST-001', 'Test Product');

      expect(Math.abs(result.priceChange)).toBeLessThan(1);
      expect(result.priceChangePercentage).toBe(0.5);
    });

    it('debe manejar cambios de precio grandes', async () => {
      const largeChangeResult = {
        oldPrice: 100,
        newPrice: 150,
        changed: true,
        reason: 'Major market shift',
      };

      mockDynamicPricingEngine.updateProductPrice.mockResolvedValue(largeChangeResult);

      const result = await updateDynamicPrice.execute('TEST-001', 'Test Product');

      expect(Math.abs(result.priceChange)).toBeGreaterThan(10);
      expect(result.priceChangePercentage).toBe(50);
    });
  });
});
