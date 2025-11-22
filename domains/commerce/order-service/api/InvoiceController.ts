/**
 * Controlador de Facturas
 * 
 * Maneja las peticiones HTTP relacionadas con facturas.
 */

import { Response } from 'express';
import { asyncHandler } from '@technovastore/shared-utils';
import { AuthenticatedRequest } from '@technovastore/shared-types';

// Importar casos de uso
import { GenerateAutomaticInvoice } from '../generate-automatic-invoice/GenerateAutomaticInvoice';
import { GenerateInvoicePDF } from '../generate-invoice-pdf/GenerateInvoicePDF';
import { GetInvoiceById } from '../get-invoice-by-id/GetInvoiceById';
import { GetInvoiceByNumber } from '../get-invoice-by-number/GetInvoiceByNumber';
import { GetInvoices, GetInvoicesOptions } from '../get-invoices/GetInvoices';
import { UpdateInvoiceStatus, InvoiceStatus } from '../update-invoice-status/UpdateInvoiceStatus';
import { CancelInvoice } from '../cancel-invoice/CancelInvoice';
import { MarkInvoiceAsPaid } from '../mark-invoice-as-paid/MarkInvoiceAsPaid';

export class InvoiceController {
  static generateInvoice = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { orderId } = req.params;
    const userRole = req.headers['x-user-role'] as string;

    // Solo los admins pueden generar facturas manualmente
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    try {
      const generateInvoice = new GenerateAutomaticInvoice();
      const invoice = await generateInvoice.execute(parseInt(orderId));

      return res.status(201).json({
        success: true,
        message: 'Invoice generated successfully',
        data: invoice,
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message,
      });
    }
  });

  static generatePDF = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userRole = req.headers['x-user-role'] as string;

    // Solo los admins pueden generar PDFs
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    try {
      const generatePDF = new GenerateInvoicePDF();
      const pdfPath = await generatePDF.execute(parseInt(id));

      return res.json({
        success: true,
        message: 'PDF generated successfully',
        data: { pdfPath },
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message,
      });
    }
  });

  static getInvoiceById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const getInvoiceById = new GetInvoiceById();
    const invoice = await getInvoiceById.execute(parseInt(id));

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

  static getInvoiceByNumber = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { invoiceNumber } = req.params;

    const getInvoiceByNumber = new GetInvoiceByNumber();
    const invoice = await getInvoiceByNumber.execute(invoiceNumber);

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

  static getInvoices = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const options: GetInvoicesOptions = {
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
      status: req.query.status as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    };

    const getInvoices = new GetInvoices();
    const result = await getInvoices.execute(options);

    return res.json({
      success: true,
      data: result.invoices,
      pagination: result.pagination,
    });
  });

  static updateInvoiceStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.headers['x-user-role'] as string;

    // Solo los admins pueden actualizar el estado de facturas
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    const updateInvoiceStatus = new UpdateInvoiceStatus();
    const invoice = await updateInvoiceStatus.execute(parseInt(id), status as InvoiceStatus);

    if (!invoice) {
      return res.status(404).json({
        error: 'Invoice not found',
      });
    }

    return res.json({
      success: true,
      message: 'Invoice status updated successfully',
      data: invoice,
    });
  });

  static cancelInvoice = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const userRole = req.headers['x-user-role'] as string;

    // Solo los admins pueden cancelar facturas
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    try {
      const cancelInvoice = new CancelInvoice();
      const invoice = await cancelInvoice.execute(parseInt(id), reason);

      if (!invoice) {
        return res.status(404).json({
          error: 'Invoice not found',
        });
      }

      return res.json({
        success: true,
        message: 'Invoice cancelled successfully',
        data: invoice,
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message,
      });
    }
  });

  static markAsPaid = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userRole = req.headers['x-user-role'] as string;

    // Solo los admins pueden marcar facturas como pagadas
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    try {
      const markAsPaid = new MarkInvoiceAsPaid();
      const invoice = await markAsPaid.execute(parseInt(id));

      if (!invoice) {
        return res.status(404).json({
          error: 'Invoice not found',
        });
      }

      return res.json({
        success: true,
        message: 'Invoice marked as paid successfully',
        data: invoice,
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message,
      });
    }
  });
}
