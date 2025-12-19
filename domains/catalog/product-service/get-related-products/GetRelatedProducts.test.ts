/**
 * Tests para el caso de uso: Obtener productos relacionados
 * 
 * Prueba el algoritmo de similitud basado en:
 * - Categoría y subcategoría (40%)
 * - Rango de precio (25%)
 * - Marca (20%)
 * - Especificaciones técnicas (15%)
 */

import { Product } from '../shared/types/Product';
import { GetRelatedProducts } from './GetRelatedProducts';

describe('GetRelatedProducts', () => {
  beforeEach(async () => {
    await Product.deleteMany({});
  });

  it('should get related products from same category and subcategory', async () => {
    const mainProduct = await Product.create({
      sku: 'LAPTOP-MAIN',
      name: 'Dell XPS 15',
      description: 'Main laptop product',
      category: 'Informática',
      subcategory: 'Portátiles',
      brand: 'Dell',
      our_price: 1299.99,
      specifications: {
        ram: '16GB',
        processor: 'Intel i7',
        storage: '512GB SSD'
      },
      images: [],
      providers: []
    });

    // Producto muy similar (misma categoría, subcategoría, marca y precio cercano)
    await Product.create({
      sku: 'LAPTOP-REL-1',
      name: 'Dell XPS 13',
      description: 'Related laptop 1',
      category: 'Informática',
      subcategory: 'Portátiles',
      brand: 'Dell',
      our_price: 1199.99,
      specifications: {
        ram: '16GB',
        processor: 'Intel i7',
        storage: '256GB SSD'
      },
      images: [],
      providers: []
    });

    // Producto similar (misma categoría y subcategoría, diferente marca)
    await Product.create({
      sku: 'LAPTOP-REL-2',
      name: 'HP Pavilion',
      description: 'Related laptop 2',
      category: 'Informática',
      subcategory: 'Portátiles',
      brand: 'HP',
      our_price: 999.99,
      specifications: {
        ram: '8GB',
        processor: 'Intel i5',
        storage: '512GB SSD'
      },
      images: [],
      providers: []
    });

    // Producto menos similar (diferente subcategoría)
    await Product.create({
      sku: 'DESKTOP-001',
      name: 'Desktop PC',
      description: 'Desktop computer',
      category: 'Informática',
      subcategory: 'Sobremesa',
      brand: 'HP',
      our_price: 899.99,
      images: [],
      providers: []
    });

    // Producto no relacionado (diferente categoría)
    await Product.create({
      sku: 'MOUSE-001',
      name: 'Gaming Mouse',
      description: 'Not related - different category',
      category: 'Periféricos',
      subcategory: 'Ratones',
      brand: 'Logitech',
      our_price: 49.99,
      images: [],
      providers: []
    });

    const related = await GetRelatedProducts.execute(
      (mainProduct._id as any).toString(),
      5
    );

    expect(related.length).toBeGreaterThan(0);
    expect(related.length).toBeLessThanOrEqual(5);
    
    // El primer resultado debe ser el más similar (Dell XPS 13)
    expect(related[0].sku).toBe('LAPTOP-REL-1');
    
    // No debe incluir el producto principal
    expect(related.every(p => p.sku !== 'LAPTOP-MAIN')).toBe(true);
  });

  it('should prioritize products with same brand', async () => {
    const mainProduct = await Product.create({
      sku: 'SAMSUNG-MAIN',
      name: 'Samsung Galaxy S21',
      description: 'Main phone',
      category: 'Móviles',
      subcategory: 'Smartphones',
      brand: 'Samsung',
      our_price: 799.99,
      images: [],
      providers: []
    });

    // Mismo brand, precio similar
    await Product.create({
      sku: 'SAMSUNG-REL',
      name: 'Samsung Galaxy S20',
      description: 'Related Samsung',
      category: 'Móviles',
      subcategory: 'Smartphones',
      brand: 'Samsung',
      our_price: 699.99,
      images: [],
      providers: []
    });

    // Diferente brand, precio similar
    await Product.create({
      sku: 'IPHONE-REL',
      name: 'iPhone 12',
      description: 'Related iPhone',
      category: 'Móviles',
      subcategory: 'Smartphones',
      brand: 'Apple',
      our_price: 799.99,
      images: [],
      providers: []
    });

    const related = await GetRelatedProducts.execute(
      (mainProduct._id as any).toString(),
      5
    );

    expect(related.length).toBeGreaterThan(0);
    // El producto Samsung debe tener mayor prioridad
    expect(related[0].brand).toBe('Samsung');
  });

  it('should prioritize products with similar price', async () => {
    const mainProduct = await Product.create({
      sku: 'MAIN-MID',
      name: 'Mid-range Product',
      description: 'Main product',
      category: 'Electrónica',
      subcategory: 'Tablets',
      brand: 'Generic',
      our_price: 500.00,
      images: [],
      providers: []
    });

    // Precio muy similar
    await Product.create({
      sku: 'REL-CLOSE',
      name: 'Close Price Product',
      description: 'Close price',
      category: 'Electrónica',
      subcategory: 'Tablets',
      brand: 'Generic',
      our_price: 520.00,
      images: [],
      providers: []
    });

    // Precio muy diferente
    await Product.create({
      sku: 'REL-FAR',
      name: 'Far Price Product',
      description: 'Far price',
      category: 'Electrónica',
      subcategory: 'Tablets',
      brand: 'Generic',
      our_price: 1500.00,
      images: [],
      providers: []
    });

    const related = await GetRelatedProducts.execute(
      (mainProduct._id as any).toString(),
      5
    );

    expect(related.length).toBeGreaterThan(0);
    // El producto con precio similar debe estar primero
    expect(related[0].sku).toBe('REL-CLOSE');
  });

  it('should consider technical specifications', async () => {
    const mainProduct = await Product.create({
      sku: 'MAIN-SPECS',
      name: 'Product with Specs',
      description: 'Main',
      category: 'Informática',
      subcategory: 'Portátiles',
      brand: 'Test',
      our_price: 1000.00,
      specifications: {
        ram: '16GB',
        processor: 'Intel i7',
        screen: '15.6"'
      },
      images: [],
      providers: []
    });

    // Especificaciones muy similares
    await Product.create({
      sku: 'REL-SIMILAR-SPECS',
      name: 'Similar Specs',
      description: 'Similar',
      category: 'Informática',
      subcategory: 'Portátiles',
      brand: 'Other',
      our_price: 1100.00,
      specifications: {
        ram: '16GB',
        processor: 'Intel i7',
        screen: '15.6"'
      },
      images: [],
      providers: []
    });

    // Especificaciones diferentes
    await Product.create({
      sku: 'REL-DIFF-SPECS',
      name: 'Different Specs',
      description: 'Different',
      category: 'Informática',
      subcategory: 'Portátiles',
      brand: 'Other',
      our_price: 1050.00,
      specifications: {
        ram: '8GB',
        processor: 'Intel i5',
        screen: '13.3"'
      },
      images: [],
      providers: []
    });

    const related = await GetRelatedProducts.execute(
      (mainProduct._id as any).toString(),
      5
    );

    expect(related.length).toBeGreaterThan(0);
    // El producto con specs similares debe tener mayor score
    expect(related[0].sku).toBe('REL-SIMILAR-SPECS');
  });

  it('should respect limit parameter', async () => {
    const mainProduct = await Product.create({
      sku: 'MAIN-001',
      name: 'Main Product',
      description: 'Main',
      category: 'Electrónica',
      subcategory: 'Test',
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
        category: 'Electrónica',
        subcategory: 'Test',
        brand: 'Test',
        our_price: 100 * i,
        images: [],
        providers: []
      });
    }

    const related = await GetRelatedProducts.execute(
      (mainProduct._id as any).toString(),
      3
    );

    expect(related).toHaveLength(3);
  });

  it('should only return active products', async () => {
    const mainProduct = await Product.create({
      sku: 'MAIN-ACTIVE',
      name: 'Main Product',
      description: 'Main',
      category: 'Electrónica',
      subcategory: 'Test',
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
      category: 'Electrónica',
      subcategory: 'Test',
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
      category: 'Electrónica',
      subcategory: 'Test',
      brand: 'Test',
      our_price: 699.99,
      is_active: false,
      images: [],
      providers: []
    });

    const related = await GetRelatedProducts.execute(
      (mainProduct._id as any).toString(),
      10
    );

    expect(related).toHaveLength(1);
    expect(related[0].sku).toBe('REL-ACTIVE');
  });

  it('should return empty array when product not found', async () => {
    const related = await GetRelatedProducts.execute(
      '507f1f77bcf86cd799439011', // ID válido pero inexistente
      5
    );

    expect(related).toHaveLength(0);
  });

  it('should return empty array when no related products exist', async () => {
    const mainProduct = await Product.create({
      sku: 'ONLY-PRODUCT',
      name: 'Only Product',
      description: 'The only product in this category',
      category: 'UniqueCategory',
      subcategory: 'UniqueSubcategory',
      brand: 'Test',
      our_price: 999.99,
      images: [],
      providers: []
    });

    const related = await GetRelatedProducts.execute(
      (mainProduct._id as any).toString(),
      5
    );

    expect(related).toHaveLength(0);
  });
});
