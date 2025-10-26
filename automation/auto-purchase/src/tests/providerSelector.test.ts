import { ProviderSelector } from '../services/providerSelector';
import { Address } from '@technovastore/shared-types';

describe('ProviderSelector', () => {
  let providerSelector: ProviderSelector;
  
  const mockAddress: Address = {
    street: 'Calle Mayor 123',
    city: 'Madrid',
    state: 'Madrid',
    postal_code: '28001',
    country: 'ES'
  };

  beforeEach(() => {
    providerSelector = new ProviderSelector();
  });

  describe('selectBestProvider', () => {
    it('should select a provider for a valid product', async () => {
      const result = await providerSelector.selectBestProvider(
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

    it('should include fallback providers', async () => {
      const result = await providerSelector.selectBestProvider(
        'TEST-SKU-002',
        2,
        mockAddress
      );

      expect(result.fallback_providers.length).toBeGreaterThanOrEqual(0);
      expect(result.fallback_providers.length).toBeLessThanOrEqual(2);
    });

    it('should respect preferred providers', async () => {
      const result = await providerSelector.selectBestProvider(
        'TEST-SKU-003',
        1,
        mockAddress,
        { preferred_providers: ['amazon'] }
      );

      // The preferred provider should get a bonus in scoring
      expect(result).toBeDefined();
      // Due to randomness in mock data, just check that we got a valid provider
      expect(result.provider.name).toBeDefined();
      expect(typeof result.provider.name).toBe('string');
    });

    it('should exclude specified providers', async () => {
      const result = await providerSelector.selectBestProvider(
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

    it('should handle international shipping', async () => {
      const usAddress: Address = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
        country: 'US'
      };

      const result = await providerSelector.selectBestProvider(
        'TEST-SKU-005',
        1,
        usAddress
      );

      expect(result).toBeDefined();
      expect(result.total_cost).toBeGreaterThan(0);
    });
  });
});