// Import only what we need for testing
import { InvoiceNumberGenerator } from '../utils/invoiceNumberGenerator';
import { SpanishTaxCalculator } from '../utils/spanishTaxCalculator';

// Mock dependencies
jest.mock('../config/database');
jest.mock('../utils/logger');

describe('InvoiceService', () => {
  describe('Spanish Tax Calculation', () => {
    it('should calculate Spanish VAT correctly for technology products', () => {
      const items = [
        {
          product_name: 'Laptop Gaming',
          quantity: 1,
          unit_price: 1000,
          total_price: 1000,
        },
        {
          product_name: 'Mouse Gaming',
          quantity: 2,
          unit_price: 50,
          total_price: 100,
        },
      ];

      const result = SpanishTaxCalculator.calculateTaxes(items, true);

      expect(result.subtotal).toBe(1100);
      expect(result.totalTax).toBe(231); // 21% of 1100
      expect(result.totalWithTax).toBe(1331);
      expect(result.averageTaxRate).toBe(0.21);
    });

    it('should not charge VAT for non-Spanish customers', () => {
      const items = [
        {
          product_name: 'Laptop Gaming',
          quantity: 1,
          unit_price: 1000,
          total_price: 1000,
        },
      ];

      const result = SpanishTaxCalculator.calculateTaxes(items, false);

      expect(result.subtotal).toBe(1000);
      expect(result.totalTax).toBe(0);
      expect(result.totalWithTax).toBe(1000);
      expect(result.averageTaxRate).toBe(0);
    });

    it('should identify correct tax rates for different product categories', () => {
      expect(SpanishTaxCalculator.getTaxRateForProduct('Laptop Gaming')).toBe(0.21);
      expect(SpanishTaxCalculator.getTaxRateForProduct('Programming Book')).toBe(0.10);
      expect(SpanishTaxCalculator.getTaxRateForProduct('Unknown Product')).toBe(0.21);
    });
  });

  describe('Invoice Number Generation', () => {
    it('should validate invoice number format correctly', () => {
      expect(InvoiceNumberGenerator.validateInvoiceNumber('2024-00000001')).toBe(true);
      expect(InvoiceNumberGenerator.validateInvoiceNumber('2024-12345678')).toBe(true);
      expect(InvoiceNumberGenerator.validateInvoiceNumber('invalid')).toBe(false);
      expect(InvoiceNumberGenerator.validateInvoiceNumber('2024-123')).toBe(false);
      expect(InvoiceNumberGenerator.validateInvoiceNumber('24-00000001')).toBe(false);
    });

    it('should parse invoice number correctly', () => {
      const parsed = InvoiceNumberGenerator.parseInvoiceNumber('2024-00000123');
      expect(parsed).toEqual({
        year: 2024,
        sequenceNumber: 123,
      });

      const invalid = InvoiceNumberGenerator.parseInvoiceNumber('invalid');
      expect(invalid).toBeNull();
    });
  });

  describe('Spanish Tax ID Validation', () => {
    it('should validate Spanish NIF correctly', () => {
      // Valid NIF examples (using algorithm)
      expect(SpanishTaxCalculator.validateSpanishNIF('12345678Z')).toBe(true);
      expect(SpanishTaxCalculator.validateSpanishNIF('87654321X')).toBe(true);
      
      // Invalid formats
      expect(SpanishTaxCalculator.validateSpanishNIF('1234567Z')).toBe(false); // Too short
      expect(SpanishTaxCalculator.validateSpanishNIF('123456789')).toBe(false); // No letter
      expect(SpanishTaxCalculator.validateSpanishNIF('ABCDEFGHZ')).toBe(false); // Letters in number part
    });

    it('should validate Spanish CIF format', () => {
      expect(SpanishTaxCalculator.validateSpanishCIF('B12345678')).toBe(true);
      expect(SpanishTaxCalculator.validateSpanishCIF('A87654321')).toBe(true);
      
      // Invalid formats
      expect(SpanishTaxCalculator.validateSpanishCIF('12345678A')).toBe(false); // Starts with number
      expect(SpanishTaxCalculator.validateSpanishCIF('B1234567')).toBe(false); // Too short
      expect(SpanishTaxCalculator.validateSpanishCIF('Z12345678')).toBe(false); // Invalid first letter
    });
  });

  describe('VAT Subject Determination', () => {
    it('should determine Spanish customers are subject to VAT', () => {
      expect(SpanishTaxCalculator.isSubjectToSpanishVAT('España')).toBe(true);
      expect(SpanishTaxCalculator.isSubjectToSpanishVAT('Spain')).toBe(true);
    });

    it('should handle EU B2B reverse charge correctly', () => {
      expect(SpanishTaxCalculator.isSubjectToSpanishVAT('Germany', 'DE123456789', true)).toBe(false);
      expect(SpanishTaxCalculator.isSubjectToSpanishVAT('France', undefined, true)).toBe(true);
    });

    it('should charge VAT for EU B2C customers', () => {
      expect(SpanishTaxCalculator.isSubjectToSpanishVAT('Germany', undefined, false)).toBe(true);
      expect(SpanishTaxCalculator.isSubjectToSpanishVAT('Italy', undefined, false)).toBe(true);
    });

    it('should not charge VAT for non-EU customers', () => {
      expect(SpanishTaxCalculator.isSubjectToSpanishVAT('United States')).toBe(false);
      expect(SpanishTaxCalculator.isSubjectToSpanishVAT('Japan')).toBe(false);
      expect(SpanishTaxCalculator.isSubjectToSpanishVAT('Brazil')).toBe(false);
    });
  });

  describe('Currency and Price Formatting', () => {
    it('should format tax rates correctly', () => {
      expect(SpanishTaxCalculator.formatTaxRate(0.21)).toBe('21%');
      expect(SpanishTaxCalculator.formatTaxRate(0.10)).toBe('10%');
      expect(SpanishTaxCalculator.formatTaxRate(0.04)).toBe('4%');
      expect(SpanishTaxCalculator.formatTaxRate(0)).toBe('0%');
    });

    it('should calculate prices with and without tax correctly', () => {
      const priceExcludingTax = 100;
      const taxRate = 0.21;
      
      const priceWithTax = SpanishTaxCalculator.calculatePriceWithTax(priceExcludingTax, taxRate);
      expect(priceWithTax).toBe(121);
      
      const backToExcluding = SpanishTaxCalculator.calculatePriceExcludingTax(priceWithTax, taxRate);
      expect(Math.round(backToExcluding * 100) / 100).toBe(100);
    });
  });
});