import { DataNormalizer } from '../src/normalizer/DataNormalizer';

describe('Sync Engine - Data Normalizer', () => {
  let normalizer: DataNormalizer;

  beforeEach(() => {
    normalizer = new DataNormalizer();
  });

  describe('DataNormalizer', () => {
    it('should create an instance of DataNormalizer', () => {
      expect(normalizer).toBeDefined();
      expect(normalizer).toBeInstanceOf(DataNormalizer);
    });

    it('should have normalizeProduct method', () => {
      expect(typeof normalizer.normalizeProduct).toBe('function');
    });

    it('should normalize product with valid data', async () => {
      const rawProduct = {
        id: 'TEST-001',
        name: 'Test Laptop',
        description: 'A test laptop',
        price: 999.99,
        currency: 'USD',
        availability: true,
        images: ['https://example.com/image1.jpg'],
        specifications: {
          model: 'TL-2024'
        },
        category: 'Electronics',
        brand: 'TestBrand',
        url: 'https://example.com/test',
        shipping_cost: 10,
        delivery_time: 5
      };

      const normalized = await normalizer.normalizeProduct(rawProduct, 'amazon');

      expect(normalized).toBeDefined();
      expect(normalized.name).toBeDefined();
      expect(normalized.sku).toBeDefined();
      expect(normalized.providers).toBeDefined();
      expect(normalized.providers.length).toBeGreaterThan(0);
    });

    it('should handle product with minimal data', async () => {
      const rawProduct = {
        id: 'TEST-002',
        name: 'Test Product',
        description: 'Test',
        price: 49.99,
        currency: 'USD',
        availability: true,
        images: [],
        specifications: {},
        category: 'Other',
        brand: 'Unknown',
        url: 'https://example.com/test2'
      };

      const normalized = await normalizer.normalizeProduct(rawProduct, 'ebay');

      expect(normalized).toBeDefined();
      expect(normalized.name).toBe('Test Product');
      expect(normalized.images).toEqual([]);
    });

    it('should generate SKU for products', async () => {
      const rawProduct = {
        id: 'TEST-003',
        name: 'Test Item',
        description: 'Test',
        price: 29.99,
        currency: 'USD',
        availability: true,
        images: [],
        specifications: {},
        category: 'Electronics',
        brand: 'TestBrand',
        url: 'https://example.com/test3'
      };

      const normalized = await normalizer.normalizeProduct(rawProduct, 'aliexpress');

      expect(normalized.sku).toBeDefined();
      expect(typeof normalized.sku).toBe('string');
      expect(normalized.sku.length).toBeGreaterThan(0);
    });
  });
});
