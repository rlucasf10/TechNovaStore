/**
 * Tests MUY COMPLETOS para el caso de uso: Generar PDF de Factura
 */

import { GenerateInvoicePDF } from './GenerateInvoicePDF';
import { Invoice } from '../shared/models/Invoice';
import { Order } from '../shared/models/Order';
import { OrderItem } from '../shared/models/OrderItem';
import { logger } from '../shared/utils/logger';
import * as PDFGenerator from '../shared/utils/pdfGenerator';
import { SpanishTaxCalculator } from '../shared/utils/spanishTaxCalculator';

jest.mock('../shared/models/Invoice');
jest.mock('../shared/models/Order');
jest.mock('../shared/models/OrderItem');
jest.mock('../shared/utils/logger');
jest.mock('../shared/utils/pdfGenerator');
jest.mock('../shared/utils/spanishTaxCalculator');

describe('GenerateInvoicePDF', () => {
  let generateInvoicePDF: GenerateInvoicePDF;
  let mockInvoice: any;
  let mockOrder: any;

  beforeEach(() => {
    jest.clearAllMocks();
    generateInvoicePDF = new GenerateInvoicePDF();

    mockOrder = {
      id: 1,
      billing_address: {
        name: 'John Doe',
        street: '123 Main St',
        city: 'Madrid',
        state: 'Madrid',
        postal_code: '28001',
        country: 'España',
      },
      payment_method: 'credit_card',
      notes: 'Test notes',
      items: [
        {
          product_name: 'Product 1',
          quantity: 2,
          unit_price: 50.00,
          total_price: 100.00,
        },
      ],
    };

    mockInvoice = {
      id: 1,
      invoice_number: 'INV-2024-001',
      issued_date: new Date('2024-01-01'),
      due_date: new Date('2024-01-31'),
      subtotal: 100.00,
      tax_amount: 21.00,
      total_amount: 121.00,
      currency: 'EUR',
      pdf_url: null,
      order: mockOrder,
      save: jest.fn(),
    };
  });

  describe('Casos exitosos', () => {
    it('should generate PDF for invoice', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);
      (SpanishTaxCalculator.getTaxRateForProduct as jest.Mock).mockReturnValue(0.21);
      (PDFGenerator.generateInvoicePDF as jest.Mock).mockResolvedValue('/path/to/invoice.pdf');

      const result = await generateInvoicePDF.execute(1);

      expect(Invoice.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(PDFGenerator.generateInvoicePDF).toHaveBeenCalled();
      expect(mockInvoice.save).toHaveBeenCalled();
      expect(result).toBe('/path/to/invoice.pdf');
    });

    it('should update invoice with PDF URL', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);
      (SpanishTaxCalculator.getTaxRateForProduct as jest.Mock).mockReturnValue(0.21);
      (PDFGenerator.generateInvoicePDF as jest.Mock).mockResolvedValue('/path/to/invoice.pdf');

      await generateInvoicePDF.execute(1);

      expect(mockInvoice.pdf_url).toBe('/path/to/invoice.pdf');
      expect(mockInvoice.save).toHaveBeenCalled();
    });

    it('should log PDF generation', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);
      (SpanishTaxCalculator.getTaxRateForProduct as jest.Mock).mockReturnValue(0.21);
      (PDFGenerator.generateInvoicePDF as jest.Mock).mockResolvedValue('/path/to/invoice.pdf');

      await generateInvoicePDF.execute(1);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Invoice PDF generated'),
        expect.objectContaining({
          invoiceId: 1,
          pdfPath: '/path/to/invoice.pdf',
        })
      );
    });

    it('should include order items in PDF data', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);
      (SpanishTaxCalculator.getTaxRateForProduct as jest.Mock).mockReturnValue(0.21);
      (PDFGenerator.generateInvoicePDF as jest.Mock).mockResolvedValue('/path/to/invoice.pdf');

      await generateInvoicePDF.execute(1);

      expect(PDFGenerator.generateInvoicePDF).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              description: 'Product 1',
              quantity: 2,
              unit_price: 50.00,
              total_price: 100.00,
            }),
          ]),
        })
      );
    });

    it('should calculate tax for each line item', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);
      (SpanishTaxCalculator.getTaxRateForProduct as jest.Mock).mockReturnValue(0.21);
      (PDFGenerator.generateInvoicePDF as jest.Mock).mockResolvedValue('/path/to/invoice.pdf');

      await generateInvoicePDF.execute(1);

      expect(SpanishTaxCalculator.getTaxRateForProduct).toHaveBeenCalledWith('Product 1');
    });

    it('should include company info in PDF data', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);
      (SpanishTaxCalculator.getTaxRateForProduct as jest.Mock).mockReturnValue(0.21);
      (PDFGenerator.generateInvoicePDF as jest.Mock).mockResolvedValue('/path/to/invoice.pdf');

      await generateInvoicePDF.execute(1);

      expect(PDFGenerator.generateInvoicePDF).toHaveBeenCalledWith(
        expect.objectContaining({
          company_info: expect.objectContaining({
            name: 'TechNovaStore S.L.',
            cif: 'B12345678',
          }),
        })
      );
    });

    it('should include customer info in PDF data', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);
      (SpanishTaxCalculator.getTaxRateForProduct as jest.Mock).mockReturnValue(0.21);
      (PDFGenerator.generateInvoicePDF as jest.Mock).mockResolvedValue('/path/to/invoice.pdf');

      await generateInvoicePDF.execute(1);

      expect(PDFGenerator.generateInvoicePDF).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_info: expect.objectContaining({
            name: 'John Doe',
            address: expect.objectContaining({
              street: '123 Main St',
              city: 'Madrid',
            }),
          }),
        })
      );
    });

    it('should handle multiple line items', async () => {
      mockOrder.items = [
        { product_name: 'Product 1', quantity: 1, unit_price: 10.00, total_price: 10.00 },
        { product_name: 'Product 2', quantity: 2, unit_price: 20.00, total_price: 40.00 },
        { product_name: 'Product 3', quantity: 3, unit_price: 30.00, total_price: 90.00 },
      ];
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);
      (SpanishTaxCalculator.getTaxRateForProduct as jest.Mock).mockReturnValue(0.21);
      (PDFGenerator.generateInvoicePDF as jest.Mock).mockResolvedValue('/path/to/invoice.pdf');

      await generateInvoicePDF.execute(1);

      const pdfData = (PDFGenerator.generateInvoicePDF as jest.Mock).mock.calls[0][0];
      expect(pdfData.line_items).toHaveLength(3);
    });
  });

  describe('Manejo de errores', () => {
    it('should throw error if invoice not found', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(generateInvoicePDF.execute(999)).rejects.toThrow('Invoice not found: 999');
    });

    it('should throw error if order not found', async () => {
      mockInvoice.order = null;
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);

      await expect(generateInvoicePDF.execute(1)).rejects.toThrow('Order not found for invoice');
    });

    it('should handle PDF generation errors', async () => {
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);
      (SpanishTaxCalculator.getTaxRateForProduct as jest.Mock).mockReturnValue(0.21);
      (PDFGenerator.generateInvoicePDF as jest.Mock).mockRejectedValue(new Error('PDF generation failed'));

      await expect(generateInvoicePDF.execute(1)).rejects.toThrow('PDF generation failed');
    });

    it('should handle database errors', async () => {
      (Invoice.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(generateInvoicePDF.execute(1)).rejects.toThrow('Database error');
    });

    it('should handle save errors', async () => {
      mockInvoice.save.mockRejectedValue(new Error('Save failed'));
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);
      (SpanishTaxCalculator.getTaxRateForProduct as jest.Mock).mockReturnValue(0.21);
      (PDFGenerator.generateInvoicePDF as jest.Mock).mockResolvedValue('/path/to/invoice.pdf');

      await expect(generateInvoicePDF.execute(1)).rejects.toThrow('Save failed');
    });
  });

  describe('Validación de datos', () => {
    it('should handle missing customer name', async () => {
      mockOrder.billing_address.name = null;
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);
      (SpanishTaxCalculator.getTaxRateForProduct as jest.Mock).mockReturnValue(0.21);
      (PDFGenerator.generateInvoicePDF as jest.Mock).mockResolvedValue('/path/to/invoice.pdf');

      await generateInvoicePDF.execute(1);

      const pdfData = (PDFGenerator.generateInvoicePDF as jest.Mock).mock.calls[0][0];
      expect(pdfData.customer_info.name).toBe('Cliente');
    });

    it('should handle empty items array', async () => {
      mockOrder.items = [];
      (Invoice.findByPk as jest.Mock).mockResolvedValue(mockInvoice);
      (PDFGenerator.generateInvoicePDF as jest.Mock).mockResolvedValue('/path/to/invoice.pdf');

      await generateInvoicePDF.execute(1);

      const pdfData = (PDFGenerator.generateInvoicePDF as jest.Mock).mock.calls[0][0];
      expect(pdfData.line_items).toEqual([]);
    });
  });
});
