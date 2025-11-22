/**
 * Tests para el caso de uso: Eliminar producto
 */

import { Product } from '../shared/types/Product';
import { DeleteProduct } from './DeleteProduct';

describe('DeleteProduct', () => {
  beforeEach(async () => {
    await Product.deleteMany({});
  });

  it('should delete product successfully', async () => {
    const product = await Product.create({
      sku: 'DELETE-001',
      name: 'Product to Delete',
      description: 'This product will be deleted',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 299.99,
      images: [],
      providers: []
    });

    const result = await DeleteProduct.execute((product._id as any).toString());

    expect(result).toBe(true);

    const found = await Product.findById(product._id);
    expect(found).toBeNull();
  });

  it('should return false for non-existent product', async () => {
    const result = await DeleteProduct.execute('507f1f77bcf86cd799439011');

    expect(result).toBe(false);
  });

  it('should handle invalid ID format gracefully', async () => {
    // Mongoose lanza un CastError para IDs inválidos
    await expect(DeleteProduct.execute('invalid-id-format')).rejects.toThrow();
  });

  it('should completely remove product from database', async () => {
    const product = await Product.create({
      sku: 'DELETE-002',
      name: 'Another Product to Delete',
      description: 'This will be removed',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 399.99,
      images: ['https://example.com/image.jpg'],
      specifications: {
        color: 'Black',
        weight: '2kg'
      },
      providers: [
        {
          name: 'Provider A',
          price: 350,
          availability: true,
          shipping_cost: 10,
          delivery_time: 5,
          last_updated: new Date()
        }
      ]
    });

    const productId = (product._id as any).toString();
    await DeleteProduct.execute(productId);

    const found = await Product.findById(productId);
    expect(found).toBeNull();

    const allProducts = await Product.find({});
    expect(allProducts.every(p => (p._id as any).toString() !== productId)).toBe(true);
  });

  it('should not affect other products when deleting one', async () => {
    const product1 = await Product.create({
      sku: 'KEEP-001',
      name: 'Product to Keep',
      description: 'This stays',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 199.99,
      images: [],
      providers: []
    });

    const product2 = await Product.create({
      sku: 'DELETE-003',
      name: 'Product to Delete',
      description: 'This goes',
      category: 'Electronics',
      brand: 'Test Brand',
      our_price: 299.99,
      images: [],
      providers: []
    });

    await DeleteProduct.execute((product2._id as any).toString());

    const remaining = await Product.find({});
    expect(remaining).toHaveLength(1);
    expect(remaining[0].sku).toBe('KEEP-001');

    const kept = await Product.findById(product1._id);
    expect(kept).toBeDefined();
    expect(kept?.sku).toBe('KEEP-001');
  });
});
