import { Product } from './Product';

describe('Product Service', () => {
  beforeEach(async () => {
    // Limpiar datos de prueba antes de cada test
    await Product.deleteMany({ sku: /^TEST-/ });
  });

  describe('Product Model', () => {
    it('should create a product successfully', async () => {
      const productData = {
        sku: 'TEST-001',
        name: 'Test Product',
        description: 'Test Description',
        category: 'Electronics',
        subcategory: 'Laptops',
        brand: 'Test Brand',
        our_price: 99.99,
        markup_percentage: 20,
        images: ['https://example.com/image.jpg'],
        specifications: {
          model: 'Test Model',
          color: 'Black'
        },
        providers: []
      };

      const product = await Product.create(productData);

      expect(product).toBeDefined();
      expect(product.sku).toBe('TEST-001');
      expect(product.name).toBe('Test Product');
      expect(product.our_price).toBe(99.99);
      expect(product.brand).toBe('Test Brand');
    });

    it('should not create product without required fields', async () => {
      const productData = {
        name: 'Test Product'
        // Missing required fields like sku, category, etc.
      };

      await expect(Product.create(productData)).rejects.toThrow();
    });

    it('should find product by SKU', async () => {
      const productData = {
        sku: 'TEST-002',
        name: 'Test Product 2',
        description: 'Test Description 2',
        category: 'Electronics',
        subcategory: 'Tablets',
        brand: 'Test Brand 2',
        our_price: 149.99,
        markup_percentage: 15,
        images: [],
        providers: []
      };

      await Product.create(productData);
      const found = await Product.findOne({ sku: 'TEST-002' });

      expect(found).toBeDefined();
      expect(found?.sku).toBe('TEST-002');
      expect(found?.name).toBe('Test Product 2');
    });

    it('should update product price', async () => {
      const product = await Product.create({
        sku: 'TEST-003',
        name: 'Test Product 3',
        description: 'Test Description 3',
        category: 'Electronics',
        subcategory: 'Phones',
        brand: 'Test Brand 3',
        our_price: 199.99,
        markup_percentage: 25,
        images: [],
        providers: []
      });

      product.our_price = 179.99;
      await product.save();

      const updated = await Product.findOne({ sku: 'TEST-003' });
      expect(updated?.our_price).toBe(179.99);
    });
  });
});

