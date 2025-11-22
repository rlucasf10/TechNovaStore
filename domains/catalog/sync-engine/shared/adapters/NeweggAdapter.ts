import { BaseAdapter } from './base/BaseAdapter';
import { ProviderProduct, SearchOptions, ProviderConfig } from '../types/provider';

export class NeweggAdapter extends BaseAdapter {
  constructor(config: ProviderConfig) {
    super('Newegg', config);
  }

  async searchProducts(query: string, options: SearchOptions = {}): Promise<ProviderProduct[]> {
    try {
      const params = {
        Keyword: query,
        CategoryId: options.category ? this.getCategoryId(options.category) : undefined,
        MinPrice: options.minPrice,
        MaxPrice: options.maxPrice,
        PageSize: options.limit || 20,
        PageNumber: Math.floor((options.offset || 0) / 20) + 1,
        SortBy: 'BESTSELLING',
        StoreType: 'Newegg'
      };

      const response = await this.makeRequest<any>({
        method: 'GET',
        url: '/api/ProductSearch',
        params: this.cleanParams(params),
        headers: {
          'Authorization': this.config.apiKey,
          'SecretKey': this.config.apiSecret,
          'Content-Type': 'application/json'
        }
      });

      return this.parseNeweggResponse(response);
    } catch (error) {
      console.error(`Newegg search error for query "${query}":`, error);
      return [];
    }
  }

  async getProduct(productId: string): Promise<ProviderProduct | null> {
    try {
      const response = await this.makeRequest<any>({
        method: 'GET',
        url: `/api/ProductDetails/${productId}`,
        headers: {
          'Authorization': this.config.apiKey,
          'SecretKey': this.config.apiSecret,
          'Content-Type': 'application/json'
        }
      });

      return this.parseNeweggItem(response);
    } catch (error) {
      console.error(`Newegg product lookup error for ID "${productId}":`, error);
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

  private parseNeweggResponse(response: any): ProviderProduct[] {
    const products: ProviderProduct[] = [];
    
    try {
      const items = response.ProductListItems || [];

      for (const item of items) {
        const product = this.parseNeweggItem(item);
        if (product) {
          products.push(product);
        }
      }
    } catch (error) {
      console.error('Error parsing Newegg response:', error);
    }

    return products;
  }

  private parseNeweggItem(item: any): ProviderProduct | null {
    try {
      // Parse price information
      let price = 0;
      if (item.FinalPrice) {
        price = parseFloat(item.FinalPrice);
      } else if (item.OriginalPrice) {
        price = parseFloat(item.OriginalPrice);
      } else if (item.UnitCost) {
        price = parseFloat(item.UnitCost);
      }

      // Parse shipping information
      let shippingCost = 0;
      let deliveryTime = 5; // Default 5 days

      if (item.ShippingInfo) {
        shippingCost = parseFloat(item.ShippingInfo.ShippingCost) || 0;
        if (item.ShippingInfo.ShippingTimeDescription) {
          // Try to extract days from shipping description
          const match = item.ShippingInfo.ShippingTimeDescription.match(/(\d+)/);
          if (match) {
            deliveryTime = parseInt(match[1]);
          }
        }
      }

      const product: ProviderProduct = {
        id: item.NeweggItemNumber || item.ItemNumber,
        name: item.Title || 'Unknown Product',
        description: item.Description || item.Summary || '',
        price: price,
        currency: 'USD', // Newegg primarily uses USD
        availability: item.Instock === true || item.InventoryStatus === 'Available',
        images: this.extractNeweggImages(item),
        specifications: {
          brand: item.Brand,
          model: item.Model,
          manufacturerPartNumber: item.ManufacturerPartNumber,
          upc: item.UPC,
          category: item.CategoryDescription,
          subcategory: item.SubcategoryDescription,
          condition: item.ConditionDescription,
          warranty: item.WarrantyDescription,
          features: item.SpecialFeatures,
          dimensions: item.Dimensions,
          weight: item.Weight
        },
        category: item.CategoryDescription || 'Electronics',
        brand: item.Brand || 'Unknown',
        shipping_cost: shippingCost,
        delivery_time: deliveryTime,
        url: item.ProductUrl || `https://www.newegg.com/p/${item.NeweggItemNumber}`
      };

      return product;
    } catch (error) {
      console.error('Error parsing Newegg item:', error);
      return null;
    }
  }

  private extractNeweggImages(item: any): string[] {
    const images: string[] = [];
    
    try {
      if (item.ImageUrl) {
        images.push(item.ImageUrl);
      }
      
      if (item.LargeImageUrl) {
        images.push(item.LargeImageUrl);
      }

      if (item.SmallImageUrl) {
        images.push(item.SmallImageUrl);
      }

      if (item.ProductImages && Array.isArray(item.ProductImages)) {
        for (const img of item.ProductImages) {
          if (img.ImageUrl) {
            images.push(img.ImageUrl);
          }
        }
      }
    } catch (error) {
      console.error('Error extracting Newegg images:', error);
    }

    return images.filter(Boolean);
  }

  private getCategoryId(category: string): string {
    const categoryMap: Record<string, string> = {
      'computers': '10',
      'electronics': '1',
      'phones': '75',
      'tablets': '79',
      'gaming': '48',
      'accessories': '58'
    };

    return categoryMap[category.toLowerCase()] || '1'; // Default to electronics
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