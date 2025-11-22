/**
 * Tests para el caso de uso: Actualizar producto
 * 
 * Extraído de: test/productService.test.ts
 */

import { Product } from '../shared/types/Product';
import { UpdateProduct } from './UpdateProduct';

describe('UpdateProduct', () => {
  beforeEach(async () => {
    await Product.deleteMany({});
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

    const updated = await UpdateProduct.execute((product._id as any).toString(), { our_price: 179.99 });

    expect(updated).toBeDefined();
    expect(updated?.our_price).toBe(179.99);
  });

  it('should return null for non-existent product', async () => {
    const updated = await UpdateProduct.execute('507f1f77bcf86cd799439011', { our_price: 100 });
    expect(updated).toBeNull();
  });

  it('should update product name and description', async () => {
    const product = await Product.create({
      sku: 'UPDATE-001',
      name: 'Original Name',
      description: 'Original Description',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 299.99,
      images: [],
      providers: []
    });

    const updated = await UpdateProduct.execute((product._id as any).toString(), {
      name: 'Updated Name',
      description: 'Updated Description'
    });

    expect(updated?.name).toBe('Updated Name');
    expect(updated?.description).toBe('Updated Description');
  });

  it('should recalculate price when providers are updated', async () => {
    const product = await Product.create({
      sku: 'UPDATE-CALC-001',
      name: 'Product',
      description: 'Description',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 100,
      markup_percentage: 20,
      images: [],
      providers: []
    });

    const updated = await UpdateProduct.execute((product._id as any).toString(), {
      providers: [
        {
          name: 'New Provider',
          price: 150,
          availability: true,
          shipping_cost: 10,
          delivery_time: 3,
          last_updated: new Date()
        }
      ]
    });

    // Price should be recalculated: (150 + 10) * 1.20 = 192
    expect(updated?.our_price).toBe(192);
  });

  it('should update markup percentage and recalculate price', async () => {
    const product = await Product.create({
      sku: 'UPDATE-MARKUP-001',
      name: 'Product',
      description: 'Description',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 120,
      markup_percentage: 20,
      images: [],
      providers: [
        {
          name: 'Provider',
          price: 100,
          availability: true,
          shipping_cost: 0,
          delivery_time: 3,
          last_updated: new Date()
        }
      ]
    });

    const updated = await UpdateProduct.execute((product._id as any).toString(), {
      markup_percentage: 30
    });

    // Price should be recalculated: 100 * 1.30 = 130
    expect(updated?.our_price).toBe(130);
  });

  it('should update images array', async () => {
    const product = await Product.create({
      sku: 'UPDATE-IMG-001',
      name: 'Product',
      description: 'Description',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 99.99,
      images: ['https://example.com/old.jpg'],
      providers: []
    });

    const updated = await UpdateProduct.execute((product._id as any).toString(), {
      images: ['https://example.com/new1.jpg', 'https://example.com/new2.jpg']
    });

    expect(updated?.images).toHaveLength(2);
    expect(updated?.images).toContain('https://example.com/new1.jpg');
  });

  it('should update specifications', async () => {
    const product = await Product.create({
      sku: 'UPDATE-SPEC-001',
      name: 'Product',
      description: 'Description',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 99.99,
      specifications: { color: 'Black' },
      images: [],
      providers: []
    });

    const updated = await UpdateProduct.execute((product._id as any).toString(), {
      specifications: { color: 'White', size: 'Large' }
    });

    expect(updated?.specifications.color).toBe('White');
    expect(updated?.specifications.size).toBe('Large');
  });

  it('should update updated_at timestamp', async () => {
    const product = await Product.create({
      sku: 'UPDATE-TIME-001',
      name: 'Product',
      description: 'Description',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 99.99,
      images: [],
      providers: []
    });

    const originalUpdatedAt = product.updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 100));

    const updated = await UpdateProduct.execute((product._id as any).toString(), {
      name: 'Updated Name'
    });

    expect(updated?.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should toggle is_active status', async () => {
    const product = await Product.create({
      sku: 'UPDATE-ACTIVE-001',
      name: 'Product',
      description: 'Description',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 99.99,
      is_active: true,
      images: [],
      providers: []
    });

    const updated = await UpdateProduct.execute((product._id as any).toString(), {
      is_active: false
    });

    expect(updated?.is_active).toBe(false);
  });
});

