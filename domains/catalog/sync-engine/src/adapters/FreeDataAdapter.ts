/**
 * Free Data Adapter
 * 
 * Adapter combinado que usa APIs gratuitas sin necesidad de API keys:
 * - FakeStore API (electrónica)
 * - DummyJSON (laptops, smartphones, tablets)
 * 
 * Perfecto para desarrollo y demos sin costos.
 */

import axios from 'axios';

interface FreeProduct {
  sku: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  brand: string;
  specifications: Record<string, any>;
  images: string[];
  providers: Array<{
    name: string;
    price: number;
    availability: boolean;
    shipping_cost: number;
    delivery_time: number;
    last_updated: string;
  }>;
  our_price: number;
  markup_percentage: number;
  is_active: boolean;
  original_price?: number;
  discount_percentage?: number;
  rating?: number;
  review_count?: number;
}

export class FreeDataAdapter {
  private readonly FAKESTORE_URL = 'https://fakestoreapi.com';
  private readonly DUMMYJSON_URL = 'https://dummyjson.com';

  /**
   * Obtener todos los productos de APIs gratuitas
   */
  async fetchAllProducts(): Promise<FreeProduct[]> {
    const products: FreeProduct[] = [];

    try {
      // 1. FakeStore - Electrónica
      console.log('📦 Obteniendo productos de FakeStore API...');
      const fakeStoreProducts = await this.fetchFromFakeStore();
      products.push(...fakeStoreProducts);
      console.log(`✅ ${fakeStoreProducts.length} productos de FakeStore`);

      // 2. DummyJSON - Laptops
      console.log('💻 Obteniendo laptops de DummyJSON...');
      const laptops = await this.fetchFromDummyJSON('laptops');
      products.push(...laptops);
      console.log(`✅ ${laptops.length} laptops`);

      // 3. DummyJSON - Smartphones
      console.log('📱 Obteniendo smartphones de DummyJSON...');
      const smartphones = await this.fetchFromDummyJSON('smartphones');
      products.push(...smartphones);
      console.log(`✅ ${smartphones.length} smartphones`);

      // 4. DummyJSON - Tablets (si existe)
      try {
        console.log('📱 Obteniendo tablets de DummyJSON...');
        const tablets = await this.fetchFromDummyJSON('tablets');
        products.push(...tablets);
        console.log(`✅ ${tablets.length} tablets`);
      } catch {
        console.log('ℹ️  Categoría tablets no disponible');
      }

    } catch (error) {
      console.error('Error obteniendo productos gratuitos:', error);
    }

    return products;
  }

  /**
   * FakeStore API - Productos de electrónica
   */
  private async fetchFromFakeStore(): Promise<FreeProduct[]> {
    try {
      const response = await axios.get(
        `${this.FAKESTORE_URL}/products/category/electronics`
      );

      return response.data.map((item: any) => ({
        sku: `FS-${item.id}`,
        name: item.title,
        description: item.description,
        category: 'electronica',
        subcategory: 'accesorios',
        brand: this.extractBrand(item.title),
        specifications: {
          source: 'FakeStore API',
          original_category: item.category,
        },
        images: [item.image],
        providers: [
          {
            name: 'FakeStore',
            price: item.price,
            availability: true,
            shipping_cost: 0,
            delivery_time: 3,
            last_updated: new Date().toISOString(),
          },
        ],
        our_price: Math.round(item.price * 1.15 * 100) / 100,
        markup_percentage: 15,
        is_active: true,
        rating: item.rating?.rate || 4.0,
        review_count: item.rating?.count || 0,
      }));
    } catch (error) {
      console.error('Error en FakeStore API:', error);
      return [];
    }
  }

  /**
   * DummyJSON API - Productos por categoría
   */
  private async fetchFromDummyJSON(category: string): Promise<FreeProduct[]> {
    try {
      const response = await axios.get(
        `${this.DUMMYJSON_URL}/products/category/${category}`
      );

      return response.data.products.map((item: any) => ({
        sku: `DJ-${category.toUpperCase()}-${item.id}`,
        name: item.title,
        description: item.description,
        category: this.mapCategory(category),
        subcategory: category,
        brand: item.brand || 'Generic',
        specifications: {
          source: 'DummyJSON API',
          stock: item.stock,
          weight: item.weight,
          dimensions: item.dimensions,
          warranty: item.warrantyInformation,
          shipping: item.shippingInformation,
          return_policy: item.returnPolicy,
        },
        images: item.images || [item.thumbnail],
        providers: [
          {
            name: 'DummyJSON',
            price: item.price,
            availability: item.stock > 0,
            shipping_cost: 5.99,
            delivery_time: 5,
            last_updated: new Date().toISOString(),
          },
        ],
        our_price: Math.round(item.price * 1.2 * 100) / 100,
        markup_percentage: 20,
        is_active: item.stock > 0,
        original_price: item.discountPercentage > 0
          ? Math.round((item.price / (1 - item.discountPercentage / 100)) * 100) / 100
          : undefined,
        discount_percentage: item.discountPercentage || 0,
        rating: item.rating || 4.0,
        review_count: item.reviews?.length || 0,
      }));
    } catch (error) {
      console.error(`Error en DummyJSON API (${category}):`, error);
      return [];
    }
  }

  /**
   * Extraer marca del título del producto
   */
  private extractBrand(title: string): string {
    const brands = [
      'WD', 'Western Digital', 'Samsung', 'SanDisk', 'Seagate',
      'LG', 'Sony', 'Acer', 'ASUS', 'Dell', 'HP', 'Lenovo',
      'Apple', 'Microsoft', 'Logitech', 'Razer', 'Corsair',
    ];

    for (const brand of brands) {
      if (title.toLowerCase().includes(brand.toLowerCase())) {
        return brand;
      }
    }

    return 'Generic';
  }

  /**
   * Mapear categorías a español
   */
  private mapCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      laptops: 'portatiles',
      smartphones: 'smartphones',
      tablets: 'tablets',
      'mobile-accessories': 'accesorios',
      electronics: 'electronica',
    };

    return categoryMap[category] || category;
  }

  /**
   * Obtener categorías disponibles de DummyJSON
   */
  async getAvailableCategories(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.DUMMYJSON_URL}/products/categories`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      return [];
    }
  }
}

// Exportar instancia singleton
export const freeDataAdapter = new FreeDataAdapter();
