import { ProviderProduct } from '../types/provider';
import { NormalizedProduct, NormalizedProvider } from '../types/sync';

export class DataNormalizer {
  private categoryMappings: Map<string, string> = new Map();
  private brandMappings: Map<string, string> = new Map();

  constructor() {
    this.initializeMappings();
  }

  async normalizeProduct(product: ProviderProduct, providerName: string): Promise<NormalizedProduct> {
    // Generate SKU if not present
    const sku = this.generateSKU(product, providerName);
    
    // Normalize name
    const name = this.normalizeName(product.name);
    
    // Normalize description
    const description = this.normalizeDescription(product.description);
    
    // Normalize category
    const category = this.normalizeCategory(product.category);
    
    // Normalize brand
    const brand = this.normalizeBrand(product.brand);
    
    // Normalize images
    const images = this.normalizeImages(product.images);
    
    // Normalize specifications
    const specifications = this.normalizeSpecifications(product.specifications);
    
    // Create normalized provider info
    const provider: NormalizedProvider = {
      name: providerName,
      external_id: product.id,
      price: this.normalizePrice(product.price, product.currency),
      currency: 'EUR', // Convert everything to EUR
      availability: product.availability,
      shipping_cost: this.normalizePrice(product.shipping_cost || 0, product.currency),
      delivery_time: product.delivery_time || 7,
      last_updated: new Date(),
      url: product.url
    };

    // Calculate our price with markup
    const markup_percentage = this.calculateMarkup(provider.price, category);
    const our_price = this.calculateOurPrice(provider.price, markup_percentage);

    const normalizedProduct: NormalizedProduct = {
      sku,
      name,
      description,
      category,
      subcategory: this.normalizeSubcategory(product.category),
      brand,
      specifications,
      images,
      providers: [provider],
      our_price,
      markup_percentage,
      is_active: product.availability,
      last_synced: new Date()
    };

    return normalizedProduct;
  }

  private generateSKU(product: ProviderProduct, providerName: string): string {
    // Create a unique SKU based on product characteristics
    const brandCode = product.brand.substring(0, 3).toUpperCase();
    const nameCode = product.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
    const providerCode = providerName.substring(0, 2).toUpperCase();
    const idCode = product.id.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6);
    
    return `${brandCode}-${nameCode}-${providerCode}-${idCode}`;
  }

  private normalizeName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s\-\(\)]/g, '') // Remove special characters except basic ones
      .substring(0, 200); // Limit length
  }

  private normalizeDescription(description: string): string {
    return description
      .trim()
      .replace(/\s+/g, ' ')
      .substring(0, 1000); // Limit length
  }

  private normalizeCategory(category: string): string {
    const normalized = category.toLowerCase().trim();
    
    // Use mapping if available
    if (this.categoryMappings.has(normalized)) {
      return this.categoryMappings.get(normalized)!;
    }

    // Default category mapping
    if (normalized.includes('computer') || normalized.includes('laptop') || normalized.includes('pc')) {
      return 'Computers';
    } else if (normalized.includes('phone') || normalized.includes('mobile') || normalized.includes('smartphone')) {
      return 'Phones';
    } else if (normalized.includes('tablet') || normalized.includes('ipad')) {
      return 'Tablets';
    } else if (normalized.includes('gaming') || normalized.includes('game') || normalized.includes('console')) {
      return 'Gaming';
    } else if (normalized.includes('accessory') || normalized.includes('cable') || normalized.includes('charger')) {
      return 'Accessories';
    }

    return 'Electronics'; // Default category
  }

  private normalizeSubcategory(category: string): string | undefined {
    const normalized = category.toLowerCase().trim();
    
    if (normalized.includes('laptop')) return 'Laptops';
    if (normalized.includes('desktop')) return 'Desktops';
    if (normalized.includes('monitor')) return 'Monitors';
    if (normalized.includes('keyboard')) return 'Keyboards';
    if (normalized.includes('mouse')) return 'Mice';
    if (normalized.includes('headphone') || normalized.includes('headset')) return 'Audio';
    if (normalized.includes('speaker')) return 'Speakers';
    if (normalized.includes('camera')) return 'Cameras';
    if (normalized.includes('storage') || normalized.includes('ssd') || normalized.includes('hdd')) return 'Storage';
    
    return undefined;
  }

  private normalizeBrand(brand: string): string {
    const normalized = brand.toLowerCase().trim();
    
    // Use mapping if available
    if (this.brandMappings.has(normalized)) {
      return this.brandMappings.get(normalized)!;
    }

    // Capitalize first letter of each word
    return brand
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private normalizeImages(images: string[]): string[] {
    return images
      .filter(img => img && img.trim().length > 0)
      .map(img => img.trim())
      .filter(img => this.isValidImageUrl(img))
      .slice(0, 10); // Limit to 10 images
  }

  private normalizeSpecifications(specs: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(specs)) {
      if (value !== null && value !== undefined && value !== '') {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '_');
        normalized[normalizedKey] = value;
      }
    }
    
    return normalized;
  }

  private normalizePrice(price: number, currency: string): number {
    // Convert price to EUR (simplified conversion)
    const conversionRates: Record<string, number> = {
      'EUR': 1.0,
      'USD': 0.85,
      'GBP': 1.15,
      'CNY': 0.13,
      'JPY': 0.0065
    };

    const rate = conversionRates[currency.toUpperCase()] || 1.0;
    return Math.round(price * rate * 100) / 100; // Round to 2 decimal places
  }

  private calculateMarkup(providerPrice: number, category: string): number {
    // Different markup percentages based on category
    const markupRules: Record<string, number> = {
      'Computers': 15,
      'Phones': 20,
      'Tablets': 18,
      'Gaming': 25,
      'Accessories': 30,
      'Electronics': 20
    };

    return markupRules[category] || 20; // Default 20% markup
  }

  private calculateOurPrice(providerPrice: number, markupPercentage: number): number {
    const markup = providerPrice * (markupPercentage / 100);
    return Math.round((providerPrice + markup) * 100) / 100;
  }

  private isValidImageUrl(url: string): boolean {
    try {
      new URL(url);
      return url.match(/\.(jpg|jpeg|png|gif|webp)$/i) !== null;
    } catch {
      return false;
    }
  }

  private initializeMappings(): void {
    // Category mappings
    this.categoryMappings.set('electronics', 'Electronics');
    this.categoryMappings.set('computers & tablets', 'Computers');
    this.categoryMappings.set('cell phones & accessories', 'Phones');
    this.categoryMappings.set('video games & consoles', 'Gaming');
    
    // Brand mappings for consistency
    this.brandMappings.set('apple', 'Apple');
    this.brandMappings.set('samsung', 'Samsung');
    this.brandMappings.set('microsoft', 'Microsoft');
    this.brandMappings.set('sony', 'Sony');
    this.brandMappings.set('nintendo', 'Nintendo');
    this.brandMappings.set('hp', 'HP');
    this.brandMappings.set('dell', 'Dell');
    this.brandMappings.set('lenovo', 'Lenovo');
    this.brandMappings.set('asus', 'ASUS');
    this.brandMappings.set('acer', 'Acer');
  }

  // Method to add custom mappings
  addCategoryMapping(from: string, to: string): void {
    this.categoryMappings.set(from.toLowerCase(), to);
  }

  addBrandMapping(from: string, to: string): void {
    this.brandMappings.set(from.toLowerCase(), to);
  }

  // Method to get normalization statistics
  getNormalizationStats(): {
    categoryMappings: number;
    brandMappings: number;
  } {
    return {
      categoryMappings: this.categoryMappings.size,
      brandMappings: this.brandMappings.size
    };
  }
}