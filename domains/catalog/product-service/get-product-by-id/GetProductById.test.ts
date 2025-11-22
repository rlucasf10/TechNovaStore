/**
 * Tests para el caso de uso: Obtener producto por ID
 */

import { Product } from '../shared/types/Product';
import { GetProductById } from './GetProductById';

describe('GetProductById', () => {
  beforeEach(async () => {
    await Product.deleteMany({});
  });

  it('should get product by ID successfully', async () => {
    const productData = {
      sku: 'TEST-GET-001',
      name: 'Test Product for Get',
      description: 'Test Description for Get',
      category: 'Electronics',
      subcategory: 'Laptops',
      brand: 'Test Brand',
      our_price: 999.99,
      markup_percentage: 20,
      images: ['https://example.com/image1.jpg'],
      specifications: {
        processor: 'Intel i7',
        ram: '16GB'
      },
      providers: []
    };

    const created = await Product.create(productData);
    const found = await GetProductById.execute((created._id as any).toString());

    expect(found).toBeDefined();
    expect(found?.sku).toBe('TEST-GET-001');
    expect(found?.name).toBe('Test Product for Get');
    expect(found?.our_price).toBe(999.99);
    expect(found?.category).toBe('Electronics');
  });

  it('should return null for non-existent ID', async () => {
    const found = await GetProductById.execute('507f1f77bcf86cd799439011');
    expect(found).toBeNull();
  });

  it('should handle invalid ID format gracefully', async () => {
    // Mongoose lanza un CastError para IDs inválidos
    await expect(GetProductById.execute('invalid-id')).rejects.toThrow();
  });

  it('should return product with all fields populated', async () => {
    const productData = {
      sku: 'TEST-GET-002',
      name: 'Complete Product',
      description: 'Complete Description',
      category: 'Electronics',
      subcategory: 'Tablets',
      brand: 'Test Brand',
      our_price: 499.99,
      markup_percentage: 15,
      images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
      specifications: {
        screen: '10 inches',
        storage: '128GB'
      },
      providers: [
        {
          name: 'Provider A',
          price: 400,
          availability: true,
          shipping_cost: 10,
          delivery_time: 3,
          last_updated: new Date()
        }
      ]
    };

    const created = await Product.create(productData);
    const found = await GetProductById.execute((created._id as any).toString());

    expect(found).toBeDefined();
    expect(found?.images).toHaveLength(2);
    expect(found?.providers).toHaveLength(1);
    expect(found?.specifications.screen).toBe('10 inches');
  });
});
