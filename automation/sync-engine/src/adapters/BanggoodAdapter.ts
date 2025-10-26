import { BaseAdapter } from './base/BaseAdapter';
import { ProviderProduct, SearchOptions, ProviderConfig } from '../types/provider';

export class BanggoodAdapter extends BaseAdapter {
  constructor(config: ProviderConfig) {
    super('Banggood', config);
  }

  async searchProducts(query: string, options: SearchOptions = {}): Promise<ProviderProduct[]> {
    try {
      const params = {
        keywords: query,
        cat: options.category ? this.getCategoryId(options.category) : undefined,
        min_price: options.minPrice,
        max_price: options.maxPrice,
        page_size: options.limit || 20,
        page: Math.floor((options.offset || 0) / 20) + 1,
        sort: 'salesDesc',
        warehouse: 'ES,CN,US', // Prefer EU warehouse
        currency: 'EUR'
      };

      const response = await this.makeRequest<any>({
        method: 'GET',
        url: '/api/affiliate/product_search',
        params: this.addBanggoodAuth(params)
      });

      return this.parseBanggoodResponse(response);
    } catch (error) {
      console.error(`Banggood search error for query "${query}":`, error);
      return [];
    }
  }

  async getProduct(productId: string): Promise<ProviderProduct | null> {
    try {
      const params = {
        product_id: productId,
        currency: 'EUR'
      };

      const response = await this.makeRequest<any>({
        method: 'GET',
        url: '/api/affiliate/product_detail',
        params: this.addBanggoodAuth(params)
      });

      const products = this.parseBanggoodResponse(response);
      return products.length > 0 ? products[0] : null;
    } catch (error) {
      console.error(`Banggood product lookup error for ID "${productId}":`, error);
      return null;
    }
  }

  async checkAvailability(productId: string): Promise<boolean> {
    const product = await this.getProduct(productId);
    return product?.availability || false;
  }

  async getPrice(productId: string): Promise<number | null> {
    const product = await this.getProduct(productId);
    return product?.price || null;
  }

  private parseBanggoodResponse(response: any): ProviderProduct[] {
    const products: ProviderProduct[] = [];
    
    try {
      const items = response.data?.products || (response.data?.product ? [response.data.product] : []);

      for (const item of items) {
        // Parse price information
        let price = 0;
        if (item.price) {
          price = parseFloat(item.price);
        } else if (item.original_price) {
          price = parseFloat(item.original_price);
        }

        // Parse shipping information
        const shippingInfo = item.shipping_methods?.[0] || {};
        const shippingCost = parseFloat(shippingInfo.shipping_fee) || 0;
        const deliveryTime = parseInt(shippingInfo.delivery_days) || 10;

        const product: ProviderProduct = {
          id: item.product_id?.toString(),
          name: item.product_name || item.title || 'Unknown Product',
          description: item.product_desc || item.description || '',
          price: price,
          currency: item.currency || 'EUR',
          availability: item.stock_status === 'in_stock' || item.in_stock === true,
          images: this.extractBanggoodImages(item),
          specifications: {
            brand: item.brand,
            model: item.model,
            weight: item.weight,
            dimensions: item.dimensions,
            warranty: item.warranty,
            category: item.category_name,
            attributes: item.attributes,
            warehouse: item.warehouse
          },
          category: item.category_name || 'Electronics',
          brand: item.brand || 'Generic',
          shipping_cost: shippingCost,
          delivery_time: deliveryTime,
          url: item.product_url || `https://www.banggood.com/p-${item.product_id}.html`
        };

        products.push(product);
      }
    } catch (error) {
      console.error('Error parsing Banggood response:', error);
    }

    return products;
  }

  private extractBanggoodImages(item: any): string[] {
    const images: string[] = [];
    
    try {
      if (item.product_main_image) {
        images.push(item.product_main_image);
      }
      
      if (item.product_images && Array.isArray(item.product_images)) {
        images.push(...item.product_images);
      }

      if (item.images && Array.isArray(item.images)) {
        images.push(...item.images);
      }

      // Ensure all images are full URLs
      return images.map(img => {
        if (img.startsWith('//')) {
          return `https:${img}`;
        } else if (img.startsWith('/')) {
          return `https://img.banggood.com${img}`;
        }
        return img;
      });
    } catch (error) {
      console.error('Error extracting Banggood images:', error);
    }

    return images.filter(Boolean);
  }

  private getCategoryId(category: string): string {
    const categoryMap: Record<string, string> = {
      'computers': '1504',
      'electronics': '1501',
      'phones': '1509',
      'tablets': '1511',
      'gaming': '1520',
      'accessories': '1530'
    };

    return categoryMap[category.toLowerCase()] || '1501'; // Default to electronics
  }

  private addBanggoodAuth(params: any): any {
    return {
      ...params,
      app_id: this.config.apiKey,
      app_secret: this.config.apiSecret,
      format: 'json',
      timestamp: Math.floor(Date.now() / 1000).toString()
      // Note: In a real implementation, you would need to generate the signature
      // based on Banggood API documentation
    };
  }
}