/**
 * Rutas de la API
 * 
 * Define todas las rutas HTTP del servicio de pedidos.
 */

import { Router } from 'express';
import { OrderController } from './OrderController';
import { InvoiceController } from './InvoiceController';
import { authMiddleware, requireRole } from '../shared/middleware/auth';
import {
  validateCreateOrder,
  validateUpdateOrderStatus,
  validateUpdateTrackingInfo,
  validateOrderId,
  validateOrderNumber,
  validateOrderQuery,
  validateProcessPayment,
  validateProcessRefund,
} from '../shared/validators/orderValidator';

export const routes = Router();

// Todas las rutas de pedidos requieren autenticación
routes.use(authMiddleware);

// ===== RUTAS DE PEDIDOS =====

// Rutas de clientes
routes.post('/orders', validateCreateOrder, OrderController.createOrder);
routes.get('/orders/my-orders', validateOrderQuery, OrderController.getUserOrders);
routes.get('/orders/stats', OrderController.getOrderStats);
routes.get('/orders/:id', validateOrderId, OrderController.getOrderById);
routes.get('/orders/number/:orderNumber', validateOrderNumber, OrderController.getOrderByNumber);
routes.post('/orders/:id/cancel', validateOrderId, OrderController.cancelOrder);

// Rutas de pago
routes.post('/orders/:id/payment', validateProcessPayment, OrderController.processPayment);
routes.get('/orders/:id/payment/status', validateOrderId, OrderController.getPaymentStatus);
routes.patch('/orders/:id/payment-status', validateOrderId, OrderController.updatePaymentStatus); // Llamado por Payment Service

// Rutas de administrador
routes.get('/orders', requireRole(['admin']), validateOrderQuery, OrderController.getOrders);
routes.put('/orders/:id/status', requireRole(['admin']), validateUpdateOrderStatus, OrderController.updateOrderStatus);
routes.put('/orders/:id/tracking', requireRole(['admin']), validateUpdateTrackingInfo, OrderController.updateTrackingInfo);
routes.post('/orders/:id/refund', requireRole(['admin']), validateProcessRefund, OrderController.processRefund);

// Rutas de auto-compra (acceso interno de servicios)
routes.get('/orders/auto-purchase/pending', OrderController.getOrdersForAutoPurchase);
routes.post('/orders/:id/mark-processing', validateOrderId, OrderController.markOrderForProcessing);
routes.put('/orders/:id/provider-info', validateOrderId, OrderController.updateProviderInfo);
routes.post('/orders/:id/auto-purchase/success', validateOrderId, OrderController.reportAutoPurchaseSuccess);
routes.post('/orders/:id/auto-purchase/failure', validateOrderId, OrderController.reportAutoPurchaseFailure);

// ===== RUTAS DE FACTURAS =====

// Rutas de administrador
routes.post('/invoices/generate/:orderId', requireRole(['admin']), InvoiceController.generateInvoice);
routes.post('/invoices/:id/pdf', requireRole(['admin']), InvoiceController.generatePDF);
routes.get('/invoices', requireRole(['admin']), InvoiceController.getInvoices);
routes.get('/invoices/:id', InvoiceController.getInvoiceById);
routes.get('/invoices/number/:invoiceNumber', InvoiceController.getInvoiceByNumber);
routes.put('/invoices/:id/status', requireRole(['admin']), InvoiceController.updateInvoiceStatus);
routes.post('/invoices/:id/cancel', requireRole(['admin']), InvoiceController.cancelInvoice);
routes.post('/invoices/:id/mark-paid', requireRole(['admin']), InvoiceController.markAsPaid);
