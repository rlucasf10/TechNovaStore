import { BaseAdapter } from './base/BaseAdapter';
import { ProviderProduct, SearchOptions, ProviderConfig } from '../types/provider';

export class AliExpressAdapter extends BaseAdapter {
  constructor(config: ProviderConfig) {
    super('AliExpress', config);
  }

  async searchProducts(query: string, options: SearchOptions = {}): Promise<ProviderProduct[]> {
    try {
      const params = {
        keywords: query,
        category_id: options.category ? this.getCategoryId(options.category) : undefined,
        min_price: options.minPrice,
        max_price: options.maxPrice,
        page_size: options.limit || 20,
        page_no: Math.floor((options.offset || 0) / 20) + 1,
        sort: 'salesDesc', // Sort by sales volume
        ship_to_country: 'ES'
      };

      const response = await this.makeRequest<any>({
        method: 'GET',
        url: '/api/products/search',
        params: this.addAuthParams(params)
      });

      return this.parseAliExpressResponse(response);
    } catch (error) {
      console.error(`AliExpress search error for query "${query}":`, error);
      return [];
    }
  }

  async getProduct(productId: string): Promise<ProviderProduct | null> {
    try {
      const params = {
        product_id: productId,
        ship_to_country: 'ES',
        target_currency: 'EUR'
      };

      const response = await this.makeRequest<any>({
        method: 'GET',
        url: '/api/products/get',
        params: this.addAuthParams(params)
      });

      const products = this.parseAliExpressResponse(response);
      return products.length > 0 ? products[0] : null;
    } catch (error) {
      console.error(`AliExpress product lookup error for ID "${productId}":`, error);
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

  private parseAliExpressResponse(response: any): ProviderProduct[] {
    const products: ProviderProduct[] = [];
    
    try {
      const items = response.result?.products || response.result?.product ? [response.result.product] : [];

      for (const item of items) {
        // Parse price information
        let price = 0;
        if (item.target_sale_price) {
          price = parseFloat(item.target_sale_price);
        } else if (item.target_original_price) {
          price = parseFloat(item.target_original_price);
        }

        // Parse shipping information
        const shippingInfo = item.logistics_info_list?.[0] || {};
        const shippingCost = parseFloat(shippingInfo.logistics_fee) || 0;
        const deliveryTime = parseInt(shippingInfo.delivery_time) || 15;

        const product: ProviderProduct = {
          id: item.product_id?.toString() || item.productId?.toString(),
          name: item.product_title || item.subject || 'Unknown Product',
          description: item.product_detail_url || '',
          price: price,
          currency: item.target_currency || 'EUR',
          availability: item.product_status === 'onSelling',
          images: this.extractAliExpressImages(item),
          specifications: {
            brand: item.brand_name,
            category: item.category_name,
            unit: item.base_unit,
            packageType: item.package_type,
            productVideo: item.product_video_url,
            properties: item.aeop_ae_product_propertys
          },
          category: item.category_name || 'Electronics',
          brand: item.brand_name || 'Generic',
          shipping_cost: shippingCost,
          delivery_time: deliveryTime,
          url: item.product_detail_url || `https://www.aliexpress.com/item/${item.product_id}.html`
        };

        products.push(product);
      }
    } catch (error) {
      console.error('Error parsing AliExpress response:', error);
    }

    return products;
  }

  private extractAliExpressImages(item: any): string[] {
    const images: string[] = [];
    
    try {
      // Try different image field names
      if (item.product_main_image_url) {
        images.push(item.product_main_image_url);
      }
      
      if (item.product_small_image_urls) {
        const imageUrls = Array.isArray(item.product_small_image_urls) 
          ? item.product_small_image_urls 
          : item.product_small_image_urls.split(',');
        images.push(...imageUrls);
      }

      if (item.ae_multimedia_info_dto?.image_urls) {
        images.push(...item.ae_multimedia_info_dto.image_urls);
      }
    } catch (error) {
      console.error('Error extracting AliExpress images:', error);
    }

    return images.filter(Boolean);
  }

  private getCategoryId(category: string): string {
    const categoryMap: Record<string, string> = {
      'computers': '7',
      'electronics': '44',
      'phones': '509',
      'tablets': '502',
      'gaming': '18',
      'accessories': '1420'
    };

    return categoryMap[category.toLowerCase()] || '44'; // Default to electronics
  }

  private addAuthParams(params: any): any {
    const timestamp = Date.now().toString();
    
    return {
      ...params,
      app_key: this.config.apiKey,
      timestamp: timestamp,
      sign_method: 'md5',
      format: 'json',
      v: '2.0'
      // Note: In a real implementation, you would need to generate the signature
      // based on AliExpress API documentation
    };
  }
}