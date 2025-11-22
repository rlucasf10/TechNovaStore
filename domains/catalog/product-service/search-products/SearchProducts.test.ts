/**
 * Tests para el caso de uso: Buscar productos
 */

import { Product } from '../shared/types/Product';
import { SearchProducts } from './SearchProducts';
import { redisClient } from '../shared/infrastructure/redis';

describe('SearchProducts', () => {
  // Limpiar la base de datos y caché antes de cada test
  beforeEach(async () => {
    await Product.deleteMany({});
    // Limpiar caché de Redis
    const keys = await redisClient.keys('products:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  });

  it('should search products by text successfully', async () => {
    await Product.create({
      sku: 'LAPTOP-001',
      name: 'Gaming Laptop Dell',
      description: 'High performance gaming laptop with RTX graphics',
      category: 'Electronics',
      subcategory: 'Laptops',
      brand: 'Dell',
      our_price: 1299.99,
      markup_percentage: 20,
      images: [],
      providers: []
    });

    await Product.create({
      sku: 'LAPTOP-002',
      name: 'Business Laptop HP',
      description: 'Professional laptop for business use',
      category: 'Electronics',
      subcategory: 'Laptops',
      brand: 'HP',
      our_price: 899.99,
      markup_percentage: 15,
      images: [],
      providers: []
    });

    await Product.create({
      sku: 'MOUSE-001',
      name: 'Gaming Mouse',
      description: 'RGB gaming mouse',
      category: 'Accessories',
      brand: 'Logitech',
      our_price: 49.99,
      images: [],
      providers: []
    });

    const results = await SearchProducts.execute('laptop', 10);

    expect(results).toHaveLength(2);
    expect(results.every(p => p.name.toLowerCase().includes('laptop'))).toBe(true);
  });

  it('should return empty array when no matches found', async () => {
    await Product.create({
      sku: 'MOUSE-001',
      name: 'Gaming Mouse',
      description: 'RGB gaming mouse',
      category: 'Accessories',
      brand: 'Logitech',
      our_price: 49.99,
      images: [],
      providers: []
    });

    const results = await SearchProducts.execute('laptop', 10);

    expect(results).toHaveLength(0);
  });

  it('should respect limit parameter', async () => {
    for (let i = 1; i <= 5; i++) {
      await Product.create({
        sku: `LAPTOP-00${i}`,
        name: `Laptop Model ${i}`,
        description: `Description for laptop ${i}`,
        category: 'Electronics',
        brand: 'Test Brand',
        our_price: 500 + i * 100,
        images: [],
        providers: []
      });
    }

    const results = await SearchProducts.execute('laptop', 3);

    expect(results).toHaveLength(3);
  });

  it('should only return active products', async () => {
    await Product.create({
      sku: 'LAPTOP-ACTIVE',
      name: 'Active Laptop',
      description: 'This laptop is active',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 999.99,
      is_active: true,
      images: [],
      providers: []
    });

    await Product.create({
      sku: 'LAPTOP-INACTIVE',
      name: 'Inactive Laptop',
      description: 'This laptop is inactive',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 999.99,
      is_active: false,
      images: [],
      providers: []
    });

    const results = await SearchProducts.execute('laptop', 10);

    expect(results).toHaveLength(1);
    expect(results[0].sku).toBe('LAPTOP-ACTIVE');
  });

  it('should search in both name and description', async () => {
    await Product.create({
      sku: 'PROD-001',
      name: 'Gaming Keyboard',
      description: 'Mechanical keyboard with RGB lighting for gaming',
      category: 'Accessories',
      brand: 'Corsair',
      our_price: 129.99,
      images: [],
      providers: []
    });

    const resultsByName = await SearchProducts.execute('keyboard', 10);
    const resultsByDescription = await SearchProducts.execute('mechanical', 10);

    expect(resultsByName).toHaveLength(1);
    expect(resultsByDescription).toHaveLength(1);
    expect(resultsByName[0].sku).toBe('PROD-001');
    expect(resultsByDescription[0].sku).toBe('PROD-001');
  });
});
