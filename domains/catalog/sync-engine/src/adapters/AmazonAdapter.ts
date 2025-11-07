import { BaseAdapter } from './base/BaseAdapter';
import { ProviderProduct, SearchOptions, ProviderConfig } from '../types/provider';

export class AmazonAdapter extends BaseAdapter {
  constructor(config: ProviderConfig) {
    super('Amazon', config);
  }

  async searchProducts(query: string, options: SearchOptions = {}): Promise<ProviderProduct[]> {
    try {
      const params = {
        Keywords: query,
        SearchIndex: 'Electronics',
        ItemCount: options.limit || 10,
        ItemPage: Math.floor((options.offset || 0) / 10) + 1,
        ResponseGroup: 'ItemAttributes,Offers,Images',
        ...(options.category && { BrowseNode: this.getCategoryId(options.category) }),
        ...(options.minPrice && { MinimumPrice: Math.round(options.minPrice * 100) }),
        ...(options.maxPrice && { MaximumPrice: Math.round(options.maxPrice * 100) })
      };

      const response = await this.makeRequest<any>({
        method: 'GET',
        url: '/onca/xml',
        params: {
          ...params,
          Service: 'AWSECommerceService',
          Operation: 'ItemSearch',
          AWSAccessKeyId: this.config.apiKey,
          Timestamp: new Date().toISOString(),
          Version: '2013-08-01'
        }
      });

      return this.parseAmazonResponse(response);
    } catch (error) {
      console.error(`Amazon search error for query "${query}":`, error);
      return [];
    }
  }

  async getProduct(productId: string): Promise<ProviderProduct | null> {
    try {
      const response = await this.makeRequest<any>({
        method: 'GET',
        url: '/onca/xml',
        params: {
          Service: 'AWSECommerceService',
          Operation: 'ItemLookup',
          ItemId: productId,
          ResponseGroup: 'ItemAttributes,Offers,Images,Reviews',
          AWSAccessKeyId: this.config.apiKey,
          Timestamp: new Date().toISOString(),
          Version: '2013-08-01'
        }
      });

      const products = this.parseAmazonResponse(response);
      return products.length > 0 ? products[0] : null;
    } catch (error) {
      console.error(`Amazon product lookup error for ID "${productId}":`, error);
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

  private parseAmazonResponse(response: any): ProviderProduct[] {
    const products: ProviderProduct[] = [];
    
    try {
      const items = response.ItemSearchResponse?.Items?.Item || 
                   response.ItemLookupResponse?.Items?.Item || [];
      
      const itemArray = Array.isArray(items) ? items : [items];

      for (const item of itemArray) {
        if (!item.ItemAttributes) continue;

        const attributes = item.ItemAttributes;
        const offers = item.Offers?.Offer || [];
        const offerArray = Array.isArray(offers) ? offers : [offers];
        
        // Get the lowest price from offers
        let price = 0;
        let availability = false;
        
        if (offerArray.length > 0) {
          const validOffers = offerArray.filter(offer => 
            offer.OfferListing?.Price?.Amount
          );
          
          if (validOffers.length > 0) {
            price = Math.min(...validOffers.map(offer => 
              parseInt(offer.OfferListing.Price.Amount) / 100
            ));
            availability = validOffers.some(offer => 
              offer.OfferListing?.Availability === 'Usually ships in 24 hours'
            );
          }
        }

        const product: ProviderProduct = {
          id: item.ASIN,
          name: attributes.Title || 'Unknown Product',
          description: attributes.Feature?.join('. ') || '',
          price: price,
          currency: 'EUR',
          availability: availability,
          images: this.extractImages(item.ImageSets),
          specifications: {
            brand: attributes.Brand,
            model: attributes.Model,
            manufacturer: attributes.Manufacturer,
            dimensions: attributes.ItemDimensions,
            weight: attributes.ItemDimensions?.Weight,
            color: attributes.Color,
            size: attributes.Size
          },
          category: attributes.ProductGroup || 'Electronics',
          brand: attributes.Brand || 'Unknown',
          shipping_cost: 0, // Amazon Prime assumed
          delivery_time: 2, // 2 days for Prime
          url: item.DetailPageURL || `https://amazon.es/dp/${item.ASIN}`
        };

        products.push(product);
      }
    } catch (error) {
      console.error('Error parsing Amazon response:', error);
    }

    return products;
  }

  private extractImages(imageSets: any): string[] {
    const images: string[] = [];
    
    if (!imageSets) return images;

    try {
      const sets = Array.isArray(imageSets.ImageSet) ? imageSets.ImageSet : [imageSets.ImageSet];
      
      for (const set of sets) {
        if (set.LargeImage?.URL) {
          images.push(set.LargeImage.URL);
        } else if (set.MediumImage?.URL) {
          images.push(set.MediumImage.URL);
        }
      }
    } catch (error) {
      console.error('Error extracting images:', error);
    }

    return images;
  }

  private getCategoryId(category: string): string {
    const categoryMap: Record<string, string> = {
      'computers': '541966',
      'electronics': '493964',
      'phones': '1571265031',
      'tablets': '429886031',
      'gaming': '599391031',
      'accessories': '560800031'
    };

    return categoryMap[category.toLowerCase()] || '493964'; // Default to electronics
  }
}