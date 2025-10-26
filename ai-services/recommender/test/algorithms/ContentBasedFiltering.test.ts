import { ContentBasedFiltering } from '../../src/algorithms/ContentBasedFiltering';
import { Product } from '../../src/models/Product';
import { UserInteraction } from '../../src/models/UserInteraction';

describe('ContentBasedFiltering', () => {
  let contentFilter: ContentBasedFiltering;

  beforeEach(() => {
    contentFilter = new ContentBasedFiltering();
  });

  describe('getSimilarProducts', () => {
    it('should return similar products based on content features', async () => {
      // Create test products
      const product1 = await Product.create({
        sku: 'LAPTOP001',
        name: 'Gaming Laptop Pro',
        description: 'High-performance gaming laptop with RTX graphics',
        category: 'laptops',
        brand: 'TechBrand',
        specifications: { ram: 16, storage: 512, processor: 'Intel i7' },
        images: ['image1.jpg'],
        our_price: 1500,
        is_active: true,
        tags: ['gaming', 'laptop', 'high-performance'],
        features: [],
        popularity_score: 0
      });

      const product2 = await Product.create({
        sku: 'LAPTOP002',
        name: 'Gaming Laptop Elite',
        description: 'Premium gaming laptop with advanced RTX graphics',
        category: 'laptops',
        brand: 'TechBrand',
        specifications: { ram: 32, storage: 1024, processor: 'Intel i9' },
        images: ['image2.jpg'],
        our_price: 2500,
        is_active: true,
        tags: ['gaming', 'laptop', 'premium'],
        features: [],
        popularity_score: 0
      });

      const product3 = await Product.create({
        sku: 'PHONE001',
        name: 'Smartphone Pro',
        description: 'Latest smartphone with advanced camera',
        category: 'smartphones',
        brand: 'PhoneBrand',
        specifications: { ram: 8, storage: 256, camera: '108MP' },
        images: ['image3.jpg'],
        our_price: 800,
        is_active: true,
        tags: ['smartphone', 'camera', 'mobile'],
        features: [],
        popularity_score: 0
      });

      const similarProducts = await contentFilter.getSimilarProducts('LAPTOP001', 5);

      expect(similarProducts).toBeDefined();
      expect(Array.isArray(similarProducts)).toBe(true);
      
      // Should find the other laptop as more similar than the phone
      const laptopResult = similarProducts.find(p => p.productSku === 'LAPTOP002');
      const phoneResult = similarProducts.find(p => p.productSku === 'PHONE001');
      
      if (laptopResult && phoneResult) {
        expect(laptopResult.score).toBeGreaterThan(phoneResult.score);
      }
    });

    it('should return empty array for non-existent product', async () => {
      const similarProducts = await contentFilter.getSimilarProducts('NONEXISTENT', 5);
      expect(similarProducts).toEqual([]);
    });
  });

  describe('getContentBasedRecommendations', () => {
    it('should return recommendations based on user interaction history', async () => {
      // Create test products
      await Product.create({
        sku: 'LAPTOP001',
        name: 'Gaming Laptop',
        description: 'Gaming laptop for professionals',
        category: 'laptops',
        brand: 'TechBrand',
        specifications: { ram: 16 },
        images: [],
        our_price: 1500,
        is_active: true,
        tags: ['gaming'],
        features: [],
        popularity_score: 0
      });

      await Product.create({
        sku: 'LAPTOP002',
        name: 'Business Laptop',
        description: 'Professional laptop for business',
        category: 'laptops',
        brand: 'TechBrand',
        specifications: { ram: 8 },
        images: [],
        our_price: 1000,
        is_active: true,
        tags: ['business'],
        features: [],
        popularity_score: 0
      });

      // Create user interactions
      await UserInteraction.create({
        user_id: 'user123',
        product_sku: 'LAPTOP001',
        interaction_type: 'purchase',
        timestamp: new Date()
      });

      const recommendations = await contentFilter.getContentBasedRecommendations('user123', 5);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should return empty array for user with no interactions', async () => {
      const recommendations = await contentFilter.getContentBasedRecommendations('newuser', 5);
      expect(recommendations).toEqual([]);
    });
  });
});