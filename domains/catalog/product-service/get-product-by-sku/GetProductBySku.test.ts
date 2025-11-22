/**
 * Tests para el caso de uso: Obtener producto por SKU
 * 
 * Extraído de: test/productService.test.ts
 */

import { Product } from '../shared/types/Product';
import { GetProductBySku } from './GetProductBySku';

describe('GetProductBySku', () => {
  beforeEach(async () => {
    await Product.deleteMany({});
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
    const found = await GetProductBySku.execute('TEST-002');

    expect(found).toBeDefined();
    expect(found?.sku).toBe('TEST-002');
    expect(found?.name).toBe('Test Product 2');
    expect(found?.our_price).toBe(149.99);
  });

  it('should return null for non-existent SKU', async () => {
    const found = await GetProductBySku.execute('NON-EXISTENT');
    expect(found).toBeNull();
  });

  it('should find product with uppercase SKU', async () => {
    await Product.create({
      sku: 'UPPER-SKU-001',
      name: 'Uppercase SKU Product',
      description: 'Test Description',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 299.99,
      images: [],
      providers: []
    });

    const found = await GetProductBySku.execute('UPPER-SKU-001');

    expect(found).toBeDefined();
    expect(found?.sku).toBe('UPPER-SKU-001');
  });

  it('should return product with all fields populated', async () => {
    await Product.create({
      sku: 'COMPLETE-SKU-001',
      name: 'Complete Product',
      description: 'Complete Description',
      category: 'Electronics',
      subcategory: 'Laptops',
      brand: 'Test Brand',
      our_price: 999.99,
      markup_percentage: 20,
      images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
      specifications: {
        processor: 'Intel i7',
        ram: '16GB'
      },
      providers: [
        {
          name: 'Provider A',
          price: 800,
          availability: true,
          shipping_cost: 20,
          delivery_time: 3,
          last_updated: new Date()
        }
      ]
    });

    const found = await GetProductBySku.execute('COMPLETE-SKU-001');

    expect(found).toBeDefined();
    expect(found?.images).toHaveLength(2);
    expect(found?.providers).toHaveLength(1);
    expect(found?.specifications.processor).toBe('Intel i7');
    expect(found?.subcategory).toBe('Laptops');
  });

  it('should find inactive products', async () => {
    await Product.create({
      sku: 'INACTIVE-SKU-001',
      name: 'Inactive Product',
      description: 'Inactive Description',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 199.99,
      is_active: false,
      images: [],
      providers: []
    });

    const found = await GetProductBySku.execute('INACTIVE-SKU-001');

    expect(found).toBeDefined();
    expect(found?.is_active).toBe(false);
  });

  it('should handle SKUs with special characters', async () => {
    await Product.create({
      sku: 'SPECIAL-SKU_001',
      name: 'Special SKU Product',
      description: 'Test Description',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 399.99,
      images: [],
      providers: []
    });

    const found = await GetProductBySku.execute('SPECIAL-SKU_001');

    expect(found).toBeDefined();
    expect(found?.sku).toBe('SPECIAL-SKU_001');
  });
});
