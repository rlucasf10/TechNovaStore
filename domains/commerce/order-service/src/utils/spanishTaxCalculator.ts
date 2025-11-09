/**
 * Spanish Tax Calculator
 * Implements Spanish VAT (IVA) calculation according to Spanish tax law
 * 
 * Spanish VAT Rates (as of 2024):
 * - General Rate (Tipo General): 21%
 * - Reduced Rate (Tipo Reducido): 10% - Books, medicines, food, etc.
 * - Super Reduced Rate (Tipo Superreducido): 4% - Basic necessities, medicines, etc.
 * - Exempt: 0% - Certain services and products
 */

export interface TaxCalculationResult {
  subtotal: number;
  totalTax: number;
  totalWithTax: number;
  averageTaxRate: number;
  taxBreakdown: {
    rate: number;
    base: number;
    tax: number;
  }[];
}

export interface OrderItemForTax {
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export class SpanishTaxCalculator {
  // Spanish VAT rates
  private static readonly VAT_RATES = {
    GENERAL: 0.21,      // 21% - General rate for most products
    REDUCED: 0.10,      // 10% - Reduced rate
    SUPER_REDUCED: 0.04, // 4% - Super reduced rate
    EXEMPT: 0.00,       // 0% - Exempt products
  };

  // Product categories and their corresponding VAT rates
  private static readonly PRODUCT_TAX_CATEGORIES = {
    // Technology products (General rate - 21%)
    'computer': SpanishTaxCalculator.VAT_RATES.GENERAL,
    'laptop': SpanishTaxCalculator.VAT_RATES.GENERAL,
    'smartphone': SpanishTaxCalculator.VAT_RATES.GENERAL,
    'tablet': SpanishTaxCalculator.VAT_RATES.GENERAL,
    'monitor': SpanishTaxCalculator.VAT_RATES.GENERAL,
    'keyboard': SpanishTaxCalculator.VAT_RATES.GENERAL,
    'mouse': SpanishTaxCalculator.VAT_RATES.GENERAL,
    'headphones': SpanishTaxCalculator.VAT_RATES.GENERAL,
    'speaker': SpanishTaxCalculator.VAT_RATES.GENERAL,
    'camera': SpanishTaxCalculator.VAT_RATES.GENERAL,
    'gaming': SpanishTaxCalculator.VAT_RATES.GENERAL,
    'console': SpanishTaxCalculator.VAT_RATES.GENERAL,
    'processor': SpanishTaxCalculator.VAT_RATES.GENERAL,
    'graphics': SpanishTaxCalculator.VAT_RATES.GENERAL,
    'memory': SpanishTaxCalculator.VAT_RATES.GENERAL,
    'storage': SpanishTaxCalculator.VAT_RATES.GENERAL,
    'motherboard': SpanishTaxCalculator.VAT_RATES.GENERAL,
    'power supply': SpanishTaxCalculator.VAT_RATES.GENERAL,
    'cable': SpanishTaxCalculator.VAT_RATES.GENERAL,
    'adapter': SpanishTaxCalculator.VAT_RATES.GENERAL,
    'charger': SpanishTaxCalculator.VAT_RATES.GENERAL,
    'accessory': SpanishTaxCalculator.VAT_RATES.GENERAL,
    
    // Books and educational materials (Reduced rate - 10%)
    'book': SpanishTaxCalculator.VAT_RATES.REDUCED,
    'manual': SpanishTaxCalculator.VAT_RATES.REDUCED,
    'guide': SpanishTaxCalculator.VAT_RATES.REDUCED,
    
    // Default for technology store
    'default': SpanishTaxCalculator.VAT_RATES.GENERAL,
  };

  /**
   * Calculates Spanish VAT for order items
   */
  static calculateTaxes(
    items: OrderItemForTax[],
    isSpanishCustomer: boolean = true
  ): TaxCalculationResult {
    if (!isSpanishCustomer) {
      // For non-Spanish EU customers, reverse charge may apply
      // For non-EU customers, no VAT is charged
      return this.calculateNoTax(items);
    }

    let subtotal = 0;
    let totalTax = 0;
    const taxBreakdown: { rate: number; base: number; tax: number }[] = [];
    const taxRateGroups = new Map<number, { base: number; tax: number }>();

    for (const item of items) {
      const itemSubtotal = item.total_price;
      const taxRate = this.getTaxRateForProduct(item.product_name);
      const itemTax = itemSubtotal * taxRate;

      subtotal += itemSubtotal;
      totalTax += itemTax;

      // Group by tax rate for breakdown
      const existing = taxRateGroups.get(taxRate) || { base: 0, tax: 0 };
      existing.base += itemSubtotal;
      existing.tax += itemTax;
      taxRateGroups.set(taxRate, existing);
    }

    // Create tax breakdown
    for (const [rate, amounts] of taxRateGroups) {
      taxBreakdown.push({
        rate,
        base: amounts.base,
        tax: amounts.tax,
      });
    }

    const averageTaxRate = subtotal > 0 ? totalTax / subtotal : 0;

    return {
      subtotal,
      totalTax,
      totalWithTax: subtotal + totalTax,
      averageTaxRate,
      taxBreakdown,
    };
  }

  /**
   * Calculates taxes for non-Spanish customers (no VAT)
   */
  private static calculateNoTax(items: OrderItemForTax[]): TaxCalculationResult {
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);

    return {
      subtotal,
      totalTax: 0,
      totalWithTax: subtotal,
      averageTaxRate: 0,
      taxBreakdown: [{
        rate: 0,
        base: subtotal,
        tax: 0,
      }],
    };
  }

  /**
   * Determines the appropriate VAT rate for a product
   */
  static getTaxRateForProduct(productName: string): number {
    const normalizedName = productName.toLowerCase();

    // Check for specific product categories
    for (const [category, rate] of Object.entries(this.PRODUCT_TAX_CATEGORIES)) {
      if (normalizedName.includes(category)) {
        return rate;
      }
    }

    // Default to general rate for technology products
    return this.VAT_RATES.GENERAL;
  }

  /**
   * Formats tax rate as percentage for display
   */
  static formatTaxRate(rate: number): string {
    return `${(rate * 100).toFixed(0)}%`;
  }

  /**
   * Calculates tax-inclusive price from tax-exclusive price
   */
  static calculatePriceWithTax(priceExcludingTax: number, taxRate: number): number {
    return priceExcludingTax * (1 + taxRate);
  }

  /**
   * Calculates tax-exclusive price from tax-inclusive price
   */
  static calculatePriceExcludingTax(priceIncludingTax: number, taxRate: number): number {
    return priceIncludingTax / (1 + taxRate);
  }

  /**
   * Validates Spanish CIF (Company Tax ID)
   */
  static validateSpanishCIF(cif: string): boolean {
    // Spanish CIF format: Letter + 8 digits + Control character
    const cifRegex = /^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/;
    
    if (!cifRegex.test(cif)) {
      return false;
    }

    // Additional validation logic for CIF control digit can be added here
    return true;
  }

  /**
   * Validates Spanish NIF (Personal Tax ID)
   */
  static validateSpanishNIF(nif: string): boolean {
    // Spanish NIF format: 8 digits + Control letter
    const nifRegex = /^\d{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/;
    
    if (!nifRegex.test(nif)) {
      return false;
    }

    // Validate control letter
    const number = parseInt(nif.substring(0, 8), 10);
    const letter = nif.charAt(8);
    const controlLetters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const expectedLetter = controlLetters[number % 23];

    return letter === expectedLetter;
  }

  /**
   * Determines if customer is subject to Spanish VAT
   */
  static isSubjectToSpanishVAT(
    customerCountry: string,
    customerTaxId?: string,
    isCompany: boolean = false
  ): boolean {
    // Spanish customers always pay VAT
    if (customerCountry.toLowerCase() === 'españa' || customerCountry.toLowerCase() === 'spain') {
      return true;
    }

    // EU companies with valid VAT ID may be subject to reverse charge
    const euCountries = [
      'austria', 'belgium', 'bulgaria', 'croatia', 'cyprus', 'czech republic',
      'denmark', 'estonia', 'finland', 'france', 'germany', 'greece',
      'hungary', 'ireland', 'italy', 'latvia', 'lithuania', 'luxembourg',
      'malta', 'netherlands', 'poland', 'portugal', 'romania', 'slovakia',
      'slovenia', 'sweden'
    ];

    const isEU = euCountries.includes(customerCountry.toLowerCase());
    
    if (isEU && isCompany && customerTaxId) {
      // EU B2B with valid VAT ID - reverse charge applies (no Spanish VAT)
      return false;
    }

    if (isEU) {
      // EU B2C or EU B2B without VAT ID - Spanish VAT applies
      return true;
    }

    // Non-EU customers - no Spanish VAT
    return false;
  }

  /**
   * Gets current Spanish VAT rates
   */
  static getVATRates() {
    return {
      general: this.VAT_RATES.GENERAL,
      reduced: this.VAT_RATES.REDUCED,
      superReduced: this.VAT_RATES.SUPER_REDUCED,
      exempt: this.VAT_RATES.EXEMPT,
    };
  }
}