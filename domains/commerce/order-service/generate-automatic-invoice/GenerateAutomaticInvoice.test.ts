/**
 * Tests MUY COMPLETOS para el caso de uso: Generar Factura Automática
 */

// Mock config/database ANTES de que se importe en los modelos
jest.mock('../config/database', () => ({
  sequelize: {
    transaction: jest.fn(),
    define: jest.fn(),
  },
  connectPostgreSQL: jest.fn(),
}));

// Mocks de modelos - ANTES de importar los casos de uso
jest.mock('../shared/models/Invoice', () => ({
  Invoice: {
    init: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
  },
}));

jest.mock('../shared/models/Order', () => ({
  Order: {
    init: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
  },
}));

jest.mock('../shared/models/OrderItem', () => ({
  OrderItem: {
    init: jest.fn(),
    create: jest.fn(),
    bulkCreate: jest.fn(),
    findAll: jest.fn(),
  },
}));

jest.mock('../shared/utils/logger');
jest.mock('../shared/utils/spanishTaxCalculator');
jest.mock('../shared/utils/invoiceNumberGenerator');
jest.mock('../generate-invoice-pdf/GenerateInvoicePDF');

// Imports DESPUÉS de los mocks
import { GenerateAutomaticInvoice } from './GenerateAutomaticInvoice';
import { Invoice } from '../shared/models/Invoice';
import { Order } from '../shared/models/Order';
import { OrderItem } from '../shared/models/OrderItem';
import { logger } from '../shared/utils/logger';
import { sequelize } from '../config/database';
import { SpanishTaxCalculator } from '../shared/utils/spanishTaxCalculator';
import { InvoiceNumberGenerator } from '../shared/utils/invoiceNumberGenerator';
import { GenerateInvoicePDF } from '../generate-invoice-pdf/GenerateInvoicePDF';

describe('GenerateAutomaticInvoice', () => {
  let generateAutomaticInvoice: GenerateAutomaticInvoice;
  let mockTransaction: any;
  let mockOrder: any;
  let mockInvoice: any;

  beforeEach(() => {
    jest.clearAllMocks();
    generateAutomaticInvoice = new GenerateAutomaticInvoice();

    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    mockOrder = {
      id: 1,
      order_number: 'ORD-123456',
      billing_address: {
        country: 'España',
      },
      items: [
        {
          product_name: 'Product 1',
          total_price: 100.00,
        },
      ],
    };

    mockInvoice = {
      id: 1,
      invoice_number: 'INV-2024-001',
      order_id: 1,
      subtotal: 100.00,
      tax_amount: 21.00,
      total_amount: 121.00,
    };

    (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);
  });

  describe('Casos exitosos', () => {
    it('should generate automatic invoice', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (Invoice.findOne as jest.Mock).mockResolvedValue(null);
      (InvoiceNumberGenerator.generateNext as jest.Mock).mockResolvedValue('INV-2024-001');
      (SpanishTaxCalculator.calculateTaxes as jest.Mock).mockReturnValue({
        subtotal: 100.00,
        totalTax: 21.00,
        totalWithTax: 121.00,
        averageTaxRate: 0.21,
      });
      (Invoice.create as jest.Mock).mockResolvedValue(mockInvoice);

      const result = await generateAutomaticInvoice.execute(1);

      expect(Order.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(InvoiceNumberGenerator.generateNext).toHaveBeenCalled();
      expect(SpanishTaxCalculator.calculateTaxes).toHaveBeenCalled();
      expect(Invoice.create).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toEqual(mockInvoice);
    });

    it('should return existing invoice if already exists', async () => {
      const existingInvoice = { ...mockInvoice, id: 2 };
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (Invoice.findOne as jest.Mock).mockResolvedValue(existingInvoice);

      const result = await generateAutomaticInvoice.execute(1);

      expect(Invoice.create).not.toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invoice already exists'),
        expect.any(Object)
      );
      expect(result).toEqual(existingInvoice);
    });

    it('should calculate Spanish taxes', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (Invoice.findOne as jest.Mock).mockResolvedValue(null);
      (InvoiceNumberGenerator.generateNext as jest.Mock).mockResolvedValue('INV-2024-001');
      (SpanishTaxCalculator.calculateTaxes as jest.Mock).mockReturnValue({
        subtotal: 100.00,
        totalTax: 21.00,
        totalWithTax: 121.00,
        averageTaxRate: 0.21,
      });
      (Invoice.create as jest.Mock).mockResolvedValue(mockInvoice);

      await generateAutomaticInvoice.execute(1);

      expect(SpanishTaxCalculator.calculateTaxes).toHaveBeenCalledWith(
        mockOrder.items,
        true
      );
    });

    it('should generate sequential invoice number', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (Invoice.findOne as jest.Mock).mockResolvedValue(null);
      (InvoiceNumberGenerator.generateNext as jest.Mock).mockResolvedValue('INV-2024-001');
      (SpanishTaxCalculator.calculateTaxes as jest.Mock).mockReturnValue({
        subtotal: 100.00,
        totalTax: 21.00,
        totalWithTax: 121.00,
        averageTaxRate: 0.21,
      });
      (Invoice.create as jest.Mock).mockResolvedValue(mockInvoice);

      await generateAutomaticInvoice.execute(1);

      expect(InvoiceNumberGenerator.generateNext).toHaveBeenCalled();
    });

    it('should create invoice with correct data', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (Invoice.findOne as jest.Mock).mockResolvedValue(null);
      (InvoiceNumberGenerator.generateNext as jest.Mock).mockResolvedValue('INV-2024-001');
      (SpanishTaxCalculator.calculateTaxes as jest.Mock).mockReturnValue({
        subtotal: 100.00,
        totalTax: 21.00,
        totalWithTax: 121.00,
        averageTaxRate: 0.21,
      });
      (Invoice.create as jest.Mock).mockResolvedValue(mockInvoice);

      await generateAutomaticInvoice.execute(1);

      expect(Invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          order_id: 1,
          invoice_number: 'INV-2024-001',
          subtotal: 100.00,
          tax_amount: 21.00,
          total_amount: 121.00,
          tax_rate: 0.21,
          currency: 'EUR',
          status: 'issued',
        }),
        { transaction: mockTransaction }
      );
    });

    it('should set due date to 30 days from now', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (Invoice.findOne as jest.Mock).mockResolvedValue(null);
      (InvoiceNumberGenerator.generateNext as jest.Mock).mockResolvedValue('INV-2024-001');
      (SpanishTaxCalculator.calculateTaxes as jest.Mock).mockReturnValue({
        subtotal: 100.00,
        totalTax: 21.00,
        totalWithTax: 121.00,
        averageTaxRate: 0.21,
      });
      (Invoice.create as jest.Mock).mockResolvedValue(mockInvoice);

      await generateAutomaticInvoice.execute(1);

      const createCall = (Invoice.create as jest.Mock).mock.calls[0][0];
      const dueDate = new Date(createCall.due_date);
      const expectedDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      expect(dueDate.getDate()).toBeCloseTo(expectedDueDate.getDate(), 0);
    });

    it('should log invoice generation', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (Invoice.findOne as jest.Mock).mockResolvedValue(null);
      (InvoiceNumberGenerator.generateNext as jest.Mock).mockResolvedValue('INV-2024-001');
      (SpanishTaxCalculator.calculateTaxes as jest.Mock).mockReturnValue({
        subtotal: 100.00,
        totalTax: 21.00,
        totalWithTax: 121.00,
        averageTaxRate: 0.21,
      });
      (Invoice.create as jest.Mock).mockResolvedValue(mockInvoice);

      await generateAutomaticInvoice.execute(1);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Invoice generated automatically'),
        expect.objectContaining({
          invoiceId: 1,
          orderId: 1,
          totalAmount: 121.00,
        })
      );
    });

    it('should handle non-Spanish billing address', async () => {
      mockOrder.billing_address.country = 'France';
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (Invoice.findOne as jest.Mock).mockResolvedValue(null);
      (InvoiceNumberGenerator.generateNext as jest.Mock).mockResolvedValue('INV-2024-001');
      (SpanishTaxCalculator.calculateTaxes as jest.Mock).mockReturnValue({
        subtotal: 100.00,
        totalTax: 0,
        totalWithTax: 100.00,
        averageTaxRate: 0,
      });
      (Invoice.create as jest.Mock).mockResolvedValue(mockInvoice);

      await generateAutomaticInvoice.execute(1);

      expect(SpanishTaxCalculator.calculateTaxes).toHaveBeenCalledWith(
        mockOrder.items,
        false
      );
    });
  });

  describe('Manejo de errores', () => {
    it('should throw error if order not found', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(generateAutomaticInvoice.execute(999)).rejects.toThrow('Order not found: 999');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      (Order.findByPk as jest.Mock).mockResolvedValue(mockOrder);
      (Invoice.findOne as jest.Mock).mockResolvedValue(null);
      (InvoiceNumberGenerator.generateNext as jest.Mock).mockRejectedValue(new Error('Generator error'));

      await expect(generateAutomaticInvoice.execute(1)).rejects.toThrow('Generator error');

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      (Order.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(generateAutomaticInvoice.execute(1)).rejects.toThrow('Database error');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should log errors', async () => {
      (Order.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(generateAutomaticInvoice.execute(1)).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to generate automatic invoice:',
        expect.any(Error)
      );
    });
  });
});
