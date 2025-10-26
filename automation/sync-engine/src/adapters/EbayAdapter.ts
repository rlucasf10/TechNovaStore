import { BaseAdapter } from './base/BaseAdapter';
import { ProviderProduct, SearchOptions, ProviderConfig } from '../types/provider';

export class EbayAdapter extends BaseAdapter {
  constructor(config: ProviderConfig) {
    super('eBay', config);
  }

  async searchProducts(query: string, options: SearchOptions = {}): Promise<ProviderProduct[]> {
    try {
      const params = {
        keywords: query,
        categoryId: options.category ? this.getCategoryId(options.category) : undefined,
        'pricingInfo.minPrice': options.minPrice,
        'pricingInfo.maxPrice': options.maxPrice,
        limit: options.limit || 25,
        offset: options.offset || 0,
        sort: 'price',
        'deliveryCountry': 'ES',
        'paymentMethod': 'PayPal'
      };

      const response = await this.makeRequest<any>({
        method: 'GET',
        url: '/buy/browse/v1/item_summary/search',
        params: this.cleanParams(params),
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_ES'
        }
      });

      return this.parseEbayResponse(response);
    } catch (error) {
      console.error(`eBay search error for query "${query}":`, error);
      return [];
    }
  }

  async getProduct(productId: string): Promise<ProviderProduct | null> {
    try {
      const response = await this.makeRequest<any>({
        method: 'GET',
        url: `/buy/browse/v1/item/${productId}`,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_ES'
        }
      });

      return this.parseEbayItem(response);
    } catch (error) {
      console.error(`eBay product lookup error for ID "${productId}":`, error);
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

  private parseEbayResponse(response: any): ProviderProduct[] {
    const products: ProviderProduct[] = [];
    
    try {
      const items = response.itemSummaries || [];

      for (const item of items) {
        const product = this.parseEbayItem(item);
        if (product) {
          products.push(product);
        }
      }
    } catch (error) {
      console.error('Error parsing eBay response:', error);
    }

    return products;
  }

  private parseEbayItem(item: any): ProviderProduct | null {
    try {
      // Parse price
      let price = 0;
      if (item.price?.value) {
        price = parseFloat(item.price.value);
      } else if (item.currentBidPrice?.value) {
        price = parseFloat(item.currentBidPrice.value);
      }

      // Parse shipping cost
      let shippingCost = 0;
      if (item.shippingOptions?.[0]?.shippingCost?.value) {
        shippingCost = parseFloat(item.shippingOptions[0].shippingCost.value);
      }

      // Parse delivery time
      let deliveryTime = 7; // Default 7 days
      if (item.shippingOptions?.[0]?.maxEstimatedDeliveryDate) {
        const deliveryDate = new Date(item.shippingOptions[0].maxEstimatedDeliveryDate);
        const today = new Date();
        deliveryTime = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }

      const product: ProviderProduct = {
        id: item.itemId || item.legacyItemId,
        name: item.title || 'Unknown Product',
        description: item.shortDescription || item.description || '',
        price: price,
        currency: item.price?.currency || 'EUR',
        availability: item.buyingOptions?.includes('FIXED_PRICE') || item.buyingOptions?.includes('AUCTION'),
        images: this.extractEbayImages(item),
        specifications: {
          condition: item.condition,
          conditionId: item.conditionId,
          brand: item.brand,
          mpn: item.mpn,
          gtin: item.gtin,
          categoryPath: item.categoryPath,
          itemLocation: item.itemLocation,
          seller: item.seller,
          bidCount: item.bidCount,
          timeLeft: item.timeLeft
        },
        category: this.extractCategory(item.categories || item.categoryPath),
        brand: item.brand || 'Unknown',
        shipping_cost: shippingCost,
        delivery_time: deliveryTime,
        url: item.itemWebUrl || `https://www.ebay.es/itm/${item.itemId}`
      };

      return product;
    } catch (error) {
      console.error('Error parsing eBay item:', error);
      return null;
    }
  }

  private extractEbayImages(item: any): string[] {
    const images: string[] = [];
    
    try {
      if (item.image?.imageUrl) {
        images.push(item.image.imageUrl);
      }
      
      if (item.thumbnailImages) {
        for (const thumb of item.thumbnailImages) {
          if (thumb.imageUrl) {
            images.push(thumb.imageUrl);
          }
        }
      }

      if (item.additionalImages) {
        for (const img of item.additionalImages) {
          if (img.imageUrl) {
            images.push(img.imageUrl);
          }
        }
      }
    } catch (error) {
      console.error('Error extracting eBay images:', error);
    }

    return images.filter(Boolean);
  }

  private extractCategory(categories: any): string {
    if (!categories) return 'Electronics';
    
    if (Array.isArray(categories) && categories.length > 0) {
      return categories[0].categoryName || 'Electronics';
    }
    
    if (typeof categories === 'string') {
      const parts = categories.split(' > ');
      return parts[parts.length - 1] || 'Electronics';
    }
    
    return 'Electronics';
  }

  private getCategoryId(category: string): string {
    const categoryMap: Record<string, string> = {
      'computers': '58058',
      'electronics': '293',
      'phones': '9355',
      'tablets': '171485',
      'gaming': '1249',
      'accessories': '31530'
    };

    return categoryMap[category.toLowerCase()] || '293'; // Default to electronics
  }

  private cleanParams(params: any): any {
    const cleaned: any = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    }
    
    return cleaned;
  }
}