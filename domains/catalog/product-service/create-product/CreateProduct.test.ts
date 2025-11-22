/**
 * Tests para el caso de uso: Crear producto
 * 
 * Extraído de: test/productService.test.ts
 */

import { Product } from '../shared/types/Product';
import { CreateProduct } from './CreateProduct';

describe('CreateProduct', () => {
  beforeEach(async () => {
    await Product.deleteMany({});
  });

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

    const product = await CreateProduct.execute(productData);

    expect(product).toBeDefined();
    expect(product.sku).toBe('TEST-001');
    expect(product.name).toBe('Test Product');
    expect(product.our_price).toBe(99.99);
    expect(product.brand).toBe('Test Brand');
    expect(product.is_active).toBe(true);
  });

  it('should not create product without required fields', async () => {
    const productData = {
      name: 'Test Product'
    };

    await expect(CreateProduct.execute(productData as any)).rejects.toThrow();
  });

  it('should calculate price based on providers', async () => {
    const productData = {
      sku: 'TEST-CALC-001',
      name: 'Product with Providers',
      description: 'Test Description',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 0,
      markup_percentage: 20,
      images: [],
      providers: [
        {
          name: 'Provider A',
          price: 100,
          availability: true,
          shipping_cost: 10,
          delivery_time: 3,
          last_updated: new Date()
        },
        {
          name: 'Provider B',
          price: 90,
          availability: true,
          shipping_cost: 15,
          delivery_time: 5,
          last_updated: new Date()
        }
      ]
    };

    const product = await CreateProduct.execute(productData);

    // Best price is 90 + 15 = 105, with 20% markup = 126
    expect(product.our_price).toBeGreaterThan(0);
    expect(product.our_price).toBe(126);
  });

  it('should create product with all optional fields', async () => {
    const productData = {
      sku: 'TEST-FULL-001',
      name: 'Complete Product',
      description: 'Complete Description',
      category: 'Electronics',
      subcategory: 'Laptops',
      brand: 'Test Brand',
      our_price: 999.99,
      markup_percentage: 25,
      images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
      specifications: {
        processor: 'Intel i7',
        ram: '16GB',
        storage: '512GB SSD'
      },
      providers: []
    };

    const product = await CreateProduct.execute(productData);

    expect(product.images).toHaveLength(2);
    expect(product.specifications.processor).toBe('Intel i7');
    expect(product.subcategory).toBe('Laptops');
  });

  it('should not create duplicate SKU', async () => {
    const productData = {
      sku: 'DUPLICATE-001',
      name: 'First Product',
      description: 'First Description',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 99.99,
      images: [],
      providers: []
    };

    await CreateProduct.execute(productData);

    const duplicateData = {
      ...productData,
      name: 'Second Product'
    };

    await expect(CreateProduct.execute(duplicateData)).rejects.toThrow();
  });

  it('should set created_at and updated_at timestamps', async () => {
    const productData = {
      sku: 'TEST-TIME-001',
      name: 'Timestamp Product',
      description: 'Test Description',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 99.99,
      images: [],
      providers: []
    };

    const product = await CreateProduct.execute(productData);

    expect(product.created_at).toBeDefined();
    expect(product.updated_at).toBeDefined();
  });
});
