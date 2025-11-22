/**
 * Tests para el caso de uso: Obtener productos relacionados
 */

import { Product } from '../shared/types/Product';
import { GetRelatedProducts } from './GetRelatedProducts';

describe('GetRelatedProducts', () => {
  beforeEach(async () => {
    await Product.deleteMany({});
  });

  it('should get related products from same category', async () => {
    const mainProduct = await Product.create({
      sku: 'LAPTOP-MAIN',
      name: 'Main Laptop',
      description: 'Main laptop product',
      category: 'Electronics',
      subcategory: 'Laptops',
      brand: 'Dell',
      our_price: 1299.99,
      images: [],
      providers: []
    });

    await Product.create({
      sku: 'LAPTOP-REL-1',
      name: 'Related Laptop 1',
      description: 'Related laptop 1',
      category: 'Electronics',
      subcategory: 'Laptops',
      brand: 'HP',
      our_price: 999.99,
      images: [],
      providers: []
    });

    await Product.create({
      sku: 'LAPTOP-REL-2',
      name: 'Related Laptop 2',
      description: 'Related laptop 2',
      category: 'Electronics',
      subcategory: 'Laptops',
      brand: 'Lenovo',
      our_price: 899.99,
      images: [],
      providers: []
    });

    await Product.create({
      sku: 'MOUSE-001',
      name: 'Gaming Mouse',
      description: 'Not related - different category',
      category: 'Accessories',
      brand: 'Logitech',
      our_price: 49.99,
      images: [],
      providers: []
    });

    const related = await GetRelatedProducts.execute(
      (mainProduct._id as any).toString(),
      'Electronics',
      4
    );

    expect(related).toHaveLength(2);
    expect(related.every(p => p.category === 'Electronics')).toBe(true);
    expect(related.every(p => p.sku !== 'LAPTOP-MAIN')).toBe(true);
  });

  it('should exclude the main product from results', async () => {
    const mainProduct = await Product.create({
      sku: 'PROD-MAIN',
      name: 'Main Product',
      description: 'Main product',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 599.99,
      images: [],
      providers: []
    });

    await Product.create({
      sku: 'PROD-REL',
      name: 'Related Product',
      description: 'Related product',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 499.99,
      images: [],
      providers: []
    });

    const related = await GetRelatedProducts.execute(
      (mainProduct._id as any).toString(),
      'Electronics',
      10
    );

    expect(related.every(p => p.sku !== 'PROD-MAIN')).toBe(true);
  });

  it('should respect limit parameter', async () => {
    const mainProduct = await Product.create({
      sku: 'MAIN-001',
      name: 'Main Product',
      description: 'Main',
      category: 'Electronics',
      brand: 'Test',
      our_price: 999.99,
      images: [],
      providers: []
    });

    for (let i = 1; i <= 10; i++) {
      await Product.create({
        sku: `REL-00${i}`,
        name: `Related Product ${i}`,
        description: `Related ${i}`,
        category: 'Electronics',
        brand: 'Test',
        our_price: 100 * i,
        images: [],
        providers: []
      });
    }

    const related = await GetRelatedProducts.execute(
      (mainProduct._id as any).toString(),
      'Electronics',
      3
    );

    expect(related).toHaveLength(3);
  });

  it('should only return active products', async () => {
    const mainProduct = await Product.create({
      sku: 'MAIN-ACTIVE',
      name: 'Main Product',
      description: 'Main',
      category: 'Electronics',
      brand: 'Test',
      our_price: 999.99,
      is_active: true,
      images: [],
      providers: []
    });

    await Product.create({
      sku: 'REL-ACTIVE',
      name: 'Related Active',
      description: 'Active related',
      category: 'Electronics',
      brand: 'Test',
      our_price: 799.99,
      is_active: true,
      images: [],
      providers: []
    });

    await Product.create({
      sku: 'REL-INACTIVE',
      name: 'Related Inactive',
      description: 'Inactive related',
      category: 'Electronics',
      brand: 'Test',
      our_price: 699.99,
      is_active: false,
      images: [],
      providers: []
    });

    const related = await GetRelatedProducts.execute(
      (mainProduct._id as any).toString(),
      'Electronics',
      10
    );

    expect(related).toHaveLength(1);
    expect(related[0].sku).toBe('REL-ACTIVE');
  });

  it('should return empty array when no related products exist', async () => {
    const mainProduct = await Product.create({
      sku: 'ONLY-PRODUCT',
      name: 'Only Product',
      description: 'The only product in this category',
      category: 'UniqueCategory',
      brand: 'Test',
      our_price: 999.99,
      images: [],
      providers: []
    });

    const related = await GetRelatedProducts.execute(
      (mainProduct._id as any).toString(),
      'UniqueCategory',
      4
    );

    expect(related).toHaveLength(0);
  });

  it('should return products sorted by creation date (newest first)', async () => {
    const mainProduct = await Product.create({
      sku: 'MAIN-001',
      name: 'Main Product',
      description: 'Main',
      category: 'Electronics',
      brand: 'Test',
      our_price: 999.99,
      images: [],
      providers: []
    });

    // Crear productos con pequeño delay para asegurar orden
    const product1 = await Product.create({
      sku: 'OLD-001',
      name: 'Older Product',
      description: 'Older',
      category: 'Electronics',
      brand: 'Test',
      our_price: 799.99,
      images: [],
      providers: []
    });

    await new Promise(resolve => setTimeout(resolve, 10));

    const product2 = await Product.create({
      sku: 'NEW-001',
      name: 'Newer Product',
      description: 'Newer',
      category: 'Electronics',
      brand: 'Test',
      our_price: 899.99,
      images: [],
      providers: []
    });

    const related = await GetRelatedProducts.execute(
      (mainProduct._id as any).toString(),
      'Electronics',
      10
    );

    expect(related).toHaveLength(2);
    // El más nuevo debe estar primero
    expect(related[0].sku).toBe('NEW-001');
    expect(related[1].sku).toBe('OLD-001');
  });
});
