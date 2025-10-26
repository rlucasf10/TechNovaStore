import { Request, Response } from 'express';
import { InvoiceService } from '../services/invoiceService';
import { logger } from '../utils/logger';
import { InvoiceNumberGenerator } from '../utils/invoiceNumberGenerator';
import { asyncHandler } from '../../../../shared/middleware/errorHandler';

export class InvoiceController {
  /**
   * Generates an automatic invoice for an order
   * POST /invoices/generate/:orderId
   */
  static generateInvoice = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const orderIdNum = parseInt(orderId, 10);

    if (isNaN(orderIdNum)) {
      return res.status(400).json({
        error: 'Invalid order ID',
      });
    }

    const invoice = await InvoiceService.generateAutomaticInvoice(orderIdNum);
    return res.status(201).json({
      success: true,
      data: invoice,
    });
  });

  /**
   * Gets an invoice by ID
   * GET /invoices/:id
   */
  static getInvoiceById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const invoiceId = parseInt(id, 10);

    if (isNaN(invoiceId)) {
      return res.status(400).json({
        error: 'Invalid invoice ID',
      });
    }

    const invoice = await InvoiceService.getInvoiceById(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        error: 'Invoice not found',
      });
    }

    return res.json({
      success: true,
      data: invoice,
    });
  });

  /**
   * Gets an invoice by invoice number
   * GET /invoices/number/:invoiceNumber
   */
  static getInvoiceByNumber = asyncHandler(async (req: Request, res: Response) => {
    const { invoiceNumber } = req.params;

    const invoice = await InvoiceService.getInvoiceByNumber(invoiceNumber);
    if (!invoice) {
      return res.status(404).json({
        error: 'Invoice not found',
      });
    }

    return res.json({
      success: true,
      data: invoice,
    });
  });

  /**
   * Gets all invoices with pagination
   * GET /invoices
   */
  static getInvoices = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    if (isNaN(pageNum) || isNaN(limitNum)) {
      return res.status(400).json({
        error: 'Invalid pagination parameters',
      });
    }

    const options: any = { page: pageNum, limit: limitNum };
    if (status) options.status = status as string;
    if (startDate) options.startDate = new Date(startDate as string);
    if (endDate) options.endDate = new Date(endDate as string);

    const result = await InvoiceService.getInvoices(options);
    return res.json({
      success: true,
      data: result,
    });
  });

  /**
   * Updates invoice status
   * PUT /invoices/:id/status
   */
  static updateInvoiceStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const invoiceId = parseInt(id, 10);

    if (isNaN(invoiceId)) {
      return res.status(400).json({
        error: 'Invalid invoice ID',
      });
    }

    if (!status) {
      return res.status(400).json({
        error: 'Status is required',
      });
    }

    const invoice = await InvoiceService.updateInvoiceStatus(invoiceId, status);
    if (!invoice) {
      return res.status(404).json({
        error: 'Invoice not found',
      });
    }

    return res.json({
      success: true,
      data: invoice,
    });
  });

  /**
   * Generates PDF for an invoice
   * GET /invoices/:id/pdf
   */
  static generateInvoicePDF = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const invoiceId = parseInt(id, 10);

    if (isNaN(invoiceId)) {
      return res.status(400).json({
        error: 'Invalid invoice ID',
      });
    }

    const pdfBuffer = await InvoiceService.generateInvoicePDF(invoiceId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceId}.pdf`);
    return res.send(pdfBuffer);
  });

  /**
   * Marks an invoice as paid
   * PUT /invoices/:id/paid
   */
  static markInvoiceAsPaid = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const invoiceId = parseInt(id, 10);

    if (isNaN(invoiceId)) {
      return res.status(400).json({
        error: 'Invalid invoice ID',
      });
    }

    const invoice = await InvoiceService.markInvoiceAsPaid(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        error: 'Invoice not found',
      });
    }

    return res.json({
      success: true,
      data: invoice,
    });
  });

  /**
   * Cancels an invoice
   * PUT /invoices/:id/cancel
   */
  static cancelInvoice = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const invoiceId = parseInt(id, 10);

    if (isNaN(invoiceId)) {
      return res.status(400).json({
        error: 'Invalid invoice ID',
      });
    }

    const invoice = await InvoiceService.cancelInvoice(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        error: 'Invoice not found',
      });
    }

    return res.json({
      success: true,
      data: invoice,
    });
  });

  /**
   * Gets the next invoice number
   * GET /invoices/next-number
   */
  static getNextInvoiceNumber = asyncHandler(async (_req: Request, res: Response) => {
    const nextNumber = await InvoiceNumberGenerator.getNextInvoiceNumber();
    
    return res.json({
      success: true,
      data: { nextInvoiceNumber: nextNumber },
    });
  });

  /**
   * Gets invoice statistics
   * GET /invoices/stats
   */
  static getInvoiceStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await InvoiceNumberGenerator.getSequenceStats();
    
    return res.json({
      success: true,
      data: stats,
    });
  });
}