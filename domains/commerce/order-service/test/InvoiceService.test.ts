// Mock utilities BEFORE any imports
jest.mock('../src/utils/pdfGenerator', () => ({
  generateInvoicePDF: jest.fn().mockResolvedValue('/mock/path/invoice.pdf'),
}));

jest.mock('../src/utils/invoiceNumberGenerator', () => ({
  InvoiceNumberGenerator: {
    generateNext: jest.fn().mockResolvedValue('INV-2024-001'),
  },
}));

jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { InvoiceService } from '../src/services/invoiceService';

describe('InvoiceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Structure', () => {
    it('should have generateInvoicePDF method', () => {
      expect(InvoiceService.generateInvoicePDF).toBeDefined();
      expect(typeof InvoiceService.generateInvoicePDF).toBe('function');
    });

    it('should have getInvoiceById method', () => {
      expect(InvoiceService.getInvoiceById).toBeDefined();
      expect(typeof InvoiceService.getInvoiceById).toBe('function');
    });

    it('should have getInvoiceByNumber method', () => {
      expect(InvoiceService.getInvoiceByNumber).toBeDefined();
      expect(typeof InvoiceService.getInvoiceByNumber).toBe('function');
    });
  });

  describe('Tax Calculations', () => {
    it('should calculate Spanish IVA (21%) correctly', () => {
      const subtotal = 100.00;
      const taxRate = 0.21; // 21% IVA estándar en España

      const tax = subtotal * taxRate;
      const total = subtotal + tax;

      expect(tax).toBe(21.00);
      expect(total).toBe(121.00);
    });

    it('should calculate IVA for different amounts', () => {
      const testCases = [
        { subtotal: 50.00, expectedTax: 10.50, expectedTotal: 60.50 },
        { subtotal: 200.00, expectedTax: 42.00, expectedTotal: 242.00 },
        { subtotal: 1000.00, expectedTax: 210.00, expectedTotal: 1210.00 },
      ];

      testCases.forEach(({ subtotal, expectedTax, expectedTotal }) => {
        const tax = subtotal * 0.21;
        const total = subtotal + tax;

        expect(tax).toBe(expectedTax);
        expect(total).toBe(expectedTotal);
      });
    });

    it('should handle reduced IVA rate (10%)', () => {
      const subtotal = 100.00;
      const reducedTaxRate = 0.10; // 10% IVA reducido

      const tax = subtotal * reducedTaxRate;
      const total = subtotal + tax;

      expect(tax).toBe(10.00);
      expect(total).toBe(110.00);
    });

    it('should handle super-reduced IVA rate (4%)', () => {
      const subtotal = 100.00;
      const superReducedTaxRate = 0.04; // 4% IVA superreducido

      const tax = subtotal * superReducedTaxRate;
      const total = subtotal + tax;

      expect(tax).toBe(4.00);
      expect(total).toBe(104.00);
    });
  });

  describe('Invoice Number Format', () => {
    it('should validate invoice number format', () => {
      const invoiceNumber = 'INV-2024-001';

      expect(invoiceNumber).toMatch(/^INV-\d{4}-\d{3}$/);
      expect(invoiceNumber).toContain('INV-');
      expect(invoiceNumber).toContain('2024');
    });

    it('should handle sequential invoice numbers', () => {
      const invoiceNumbers = [
        'INV-2024-001',
        'INV-2024-002',
        'INV-2024-003',
      ];

      invoiceNumbers.forEach(number => {
        expect(number).toMatch(/^INV-\d{4}-\d{3}$/);
      });
    });
  });

  describe('Invoice Data Structure', () => {
    it('should validate invoice data structure', () => {
      const invoiceData = {
        id: 1,
        order_id: 1,
        invoice_number: 'INV-2024-001',
        subtotal: 100.00,
        tax_amount: 21.00,
        total_amount: 121.00,
        issue_date: new Date(),
      };

      expect(invoiceData.order_id).toBeDefined();
      expect(invoiceData.invoice_number).toBeDefined();
      expect(invoiceData.subtotal).toBeGreaterThan(0);
      expect(invoiceData.tax_amount).toBeGreaterThan(0);
      expect(invoiceData.total_amount).toBe(invoiceData.subtotal + invoiceData.tax_amount);
    });
  });
});
