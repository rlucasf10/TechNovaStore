/**
 * Tests para el caso de uso: Listar productos
 * 
 * Extraído de: test/productService.test.ts
 */

import { Product } from '../shared/types/Product';
import { ListProducts } from './ListProducts';
import { redisClient } from '../shared/infrastructure/redis';

describe('ListProducts', () => {
  // Limpiar la base de datos y caché antes de cada test
  beforeEach(async () => {
    await Product.deleteMany({});
    // Limpiar caché de Redis
    const keys = await redisClient.keys('products:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  });

  it('should list products with pagination', async () => {
    await Product.create({
      sku: 'TEST-001',
      name: 'Test Product 1',
      description: 'Test Description 1',
      category: 'Electronics',
      subcategory: 'Laptops',
      brand: 'Test Brand',
      our_price: 99.99,
      markup_percentage: 20,
      images: [],
      providers: []
    });

    await Product.create({
      sku: 'TEST-002',
      name: 'Test Product 2',
      description: 'Test Description 2',
      category: 'Electronics',
      subcategory: 'Tablets',
      brand: 'Test Brand',
      our_price: 149.99,
      markup_percentage: 15,
      images: [],
      providers: []
    });

    const result = await ListProducts.execute({ page: 1, limit: 10 });

    expect(result.products).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    expect(result.pagination.pages).toBe(1);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(10);
  });

  it('should filter products by category', async () => {
    await Product.create({
      sku: 'TEST-003',
      name: 'Laptop',
      description: 'Test Laptop',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 999.99,
      images: [],
      providers: []
    });

    await Product.create({
      sku: 'TEST-004',
      name: 'Book',
      description: 'Test Book',
      category: 'Books',
      brand: 'Test Publisher',
      our_price: 19.99,
      images: [],
      providers: []
    });

    const result = await ListProducts.execute({ category: 'Electronics' });

    expect(result.products).toHaveLength(1);
    expect(result.products[0].category).toBe('Electronics');
  });

  it('should filter products by price range', async () => {
    await Product.create({
      sku: 'PRICE-001',
      name: 'Cheap Product',
      description: 'Low price',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 50,
      images: [],
      providers: []
    });

    await Product.create({
      sku: 'PRICE-002',
      name: 'Mid Product',
      description: 'Mid price',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 500,
      images: [],
      providers: []
    });

    await Product.create({
      sku: 'PRICE-003',
      name: 'Expensive Product',
      description: 'High price',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 1500,
      images: [],
      providers: []
    });

    const result = await ListProducts.execute({ minPrice: 100, maxPrice: 1000 });

    expect(result.products).toHaveLength(1);
    expect(result.products[0].our_price).toBe(500);
  });

  it('should filter products by brand', async () => {
    await Product.create({
      sku: 'BRAND-001',
      name: 'Dell Laptop',
      description: 'Dell product',
      category: 'Electronics',
      brand: 'Dell',
      our_price: 999,
      images: [],
      providers: []
    });

    await Product.create({
      sku: 'BRAND-002',
      name: 'HP Laptop',
      description: 'HP product',
      category: 'Electronics',
      brand: 'HP',
      our_price: 899,
      images: [],
      providers: []
    });

    const result = await ListProducts.execute({ brand: 'Dell' });

    expect(result.products).toHaveLength(1);
    expect(result.products[0].brand).toBe('Dell');
  });

  it('should sort products by price ascending', async () => {
    await Product.create({
      sku: 'SORT-001',
      name: 'Product 1',
      description: 'Description 1',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 300,
      images: [],
      providers: []
    });

    await Product.create({
      sku: 'SORT-002',
      name: 'Product 2',
      description: 'Description 2',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 100,
      images: [],
      providers: []
    });

    await Product.create({
      sku: 'SORT-003',
      name: 'Product 3',
      description: 'Description 3',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 200,
      images: [],
      providers: []
    });

    const result = await ListProducts.execute({ sortBy: 'our_price', sortOrder: 'asc' });

    expect(result.products[0].our_price).toBe(100);
    expect(result.products[1].our_price).toBe(200);
    expect(result.products[2].our_price).toBe(300);
  });

  it('should handle pagination correctly', async () => {
    // Crear 25 productos para probar paginación
    const products = [];
    for (let i = 1; i <= 25; i++) {
      products.push({
        sku: `PAGE-${String(i).padStart(3, '0')}`,
        name: `Product ${i}`,
        description: `Description ${i}`,
        category: 'Electronics',
        brand: 'Test Brand',
        our_price: 100 + i,
        images: [],
        providers: []
      });
    }
    await Product.insertMany(products);

    const page1 = await ListProducts.execute({ page: 1, limit: 10 });
    const page2 = await ListProducts.execute({ page: 2, limit: 10 });
    const page3 = await ListProducts.execute({ page: 3, limit: 10 });

    expect(page1.products).toHaveLength(10);
    expect(page2.products).toHaveLength(10);
    expect(page3.products).toHaveLength(5);
    expect(page1.pagination.pages).toBe(3);
    expect(page1.pagination.total).toBe(25);
  });

  it('should only return active products by default', async () => {
    await Product.create({
      sku: 'ACTIVE-001',
      name: 'Active Product',
      description: 'Active',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 100,
      is_active: true,
      images: [],
      providers: []
    });

    await Product.create({
      sku: 'INACTIVE-001',
      name: 'Inactive Product',
      description: 'Inactive',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 100,
      is_active: false,
      images: [],
      providers: []
    });

    const result = await ListProducts.execute({});

    expect(result.products).toHaveLength(1);
    expect(result.products[0].is_active).toBe(true);
  });

  it('should filter by subcategory', async () => {
    await Product.create({
      sku: 'SUB-001',
      name: 'Gaming Laptop',
      description: 'Gaming',
      category: 'Electronics',
      subcategory: 'Laptops',
      brand: 'Test Brand',
      our_price: 1200,
      images: [],
      providers: []
    });

    await Product.create({
      sku: 'SUB-002',
      name: 'Tablet',
      description: 'Tablet',
      category: 'Electronics',
      subcategory: 'Tablets',
      brand: 'Test Brand',
      our_price: 500,
      images: [],
      providers: []
    });

    const result = await ListProducts.execute({ subcategory: 'Laptops' });

    expect(result.products).toHaveLength(1);
    expect(result.products[0].subcategory).toBe('Laptops');
  });
});
