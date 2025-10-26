import { CostCalculator } from '../services/costCalculator';
import { ProviderInfo } from '../types/provider';
import { Address } from '@technovastore/shared-types';

describe('CostCalculator', () => {
  let costCalculator: CostCalculator;
  
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
    costCalculator = new CostCalculator();
  });

  describe('calculateTotalCost', () => {
    it('should calculate total cost correctly', async () => {
      const result = await costCalculator.calculateTotalCost(
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

    it('should apply quantity multiplier to base price', async () => {
      const singleResult = await costCalculator.calculateTotalCost(
        mockProvider,
        1,
        mockAddress
      );

      const doubleResult = await costCalculator.calculateTotalCost(
        mockProvider,
        2,
        mockAddress
      );

      expect(doubleResult.base_price).toBe(singleResult.base_price * 2);
    });

    it('should calculate different costs for different countries', async () => {
      const esResult = await costCalculator.calculateTotalCost(
        mockProvider,
        1,
        mockAddress
      );

      const usAddress: Address = {
        ...mockAddress,
        country: 'US'
      };

      const usResult = await costCalculator.calculateTotalCost(
        mockProvider,
        1,
        usAddress
      );

      // Costs should be different due to different tax rates and shipping
      expect(esResult.total_cost).not.toBe(usResult.total_cost);
    });

    it('should include processing fees', async () => {
      const result = await costCalculator.calculateTotalCost(
        mockProvider,
        1,
        mockAddress
      );

      expect(result.fees).toBeGreaterThan(0);
      expect(result.fees).toBe(mockProvider.price * 0.02); // 2% for Amazon
    });
  });

  describe('compareCosts', () => {
    it('should compare costs between providers', async () => {
      const providers: ProviderInfo[] = [
        { ...mockProvider, name: 'Amazon', price: 100 },
        { ...mockProvider, name: 'AliExpress', price: 80 },
        { ...mockProvider, name: 'eBay', price: 95 }
      ];

      const comparisons = await costCalculator.compareCosts(
        providers,
        1,
        mockAddress
      );

      expect(comparisons).toHaveLength(3);
      expect(comparisons[0].cost.total_cost).toBeLessThanOrEqual(comparisons[1].cost.total_cost);
      expect(comparisons[1].cost.total_cost).toBeLessThanOrEqual(comparisons[2].cost.total_cost);
    });
  });
});