import { Router } from 'express';
import { InvoiceController } from '../controllers/invoiceController';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

/**
 * Invoice Routes
 * Handles all invoice-related operations for TechNovaStore
 */

// Generate automatic invoice for an order
router.post(
  '/generate/:orderId',
  [
    param('orderId')
      .isInt({ min: 1 })
      .withMessage('Order ID must be a positive integer'),
  ],
  validateRequest,
  InvoiceController.generateInvoice
);

// Get invoice by ID
router.get(
  '/:id',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invoice ID must be a positive integer'),
  ],
  validateRequest,
  InvoiceController.getInvoiceById
);

// Get invoice by invoice number
router.get(
  '/number/:invoiceNumber',
  [
    param('invoiceNumber')
      .matches(/^\d{4}-\d{8}$/)
      .withMessage('Invoice number must follow format YYYY-NNNNNNNN'),
  ],
  validateRequest,
  InvoiceController.getInvoiceByNumber
);

// Get all invoices with pagination and filters
router.get(
  '/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(['draft', 'issued', 'paid', 'cancelled'])
      .withMessage('Status must be one of: draft, issued, paid, cancelled'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
  ],
  validateRequest,
  InvoiceController.getInvoices
);

// Update invoice status
router.put(
  '/:id/status',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invoice ID must be a positive integer'),
    body('status')
      .isIn(['draft', 'issued', 'paid', 'cancelled'])
      .withMessage('Status must be one of: draft, issued, paid, cancelled'),
  ],
  validateRequest,
  InvoiceController.updateInvoiceStatus
);

// Generate PDF for invoice
router.post(
  '/:id/pdf',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invoice ID must be a positive integer'),
  ],
  validateRequest,
  InvoiceController.generateInvoicePDF
);

// Mark invoice as paid
router.post(
  '/:id/mark-paid',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invoice ID must be a positive integer'),
  ],
  validateRequest,
  InvoiceController.markInvoiceAsPaid
);

// Cancel invoice
router.post(
  '/:id/cancel',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invoice ID must be a positive integer'),
    body('reason')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Reason must be a string with maximum 500 characters'),
  ],
  validateRequest,
  InvoiceController.cancelInvoice
);

// Get next invoice number
router.get(
  '/next-number',
  InvoiceController.getNextInvoiceNumber
);

// Get invoice statistics
router.get(
  '/stats',
  InvoiceController.getInvoiceStats
);

export { router as invoiceRoutes };