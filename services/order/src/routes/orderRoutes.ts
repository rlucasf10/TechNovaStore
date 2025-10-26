import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authMiddleware, requireRole } from '../middleware/auth';
import {
  validateCreateOrder,
  validateUpdateOrderStatus,
  validateUpdateTrackingInfo,
  validateOrderId,
  validateOrderNumber,
  validateOrderQuery,
  validateProcessPayment,
  validateProcessRefund,
} from '../validators/orderValidator';

export const orderRoutes = Router();

// All order routes require authentication
orderRoutes.use(authMiddleware);

// Customer routes
orderRoutes.post('/', validateCreateOrder, OrderController.createOrder);
orderRoutes.get('/my-orders', validateOrderQuery, OrderController.getUserOrders);
orderRoutes.get('/stats', OrderController.getOrderStats);
orderRoutes.get('/:id', validateOrderId, OrderController.getOrderById);
orderRoutes.get('/number/:orderNumber', validateOrderNumber, OrderController.getOrderByNumber);
orderRoutes.post('/:id/cancel', validateOrderId, OrderController.cancelOrder);

// Payment routes
orderRoutes.post('/:id/payment', validateProcessPayment, OrderController.processPayment);
orderRoutes.get('/:id/payment/status', validateOrderId, OrderController.getPaymentStatus);

// Admin routes
orderRoutes.get('/', requireRole(['admin']), validateOrderQuery, OrderController.getOrders);
orderRoutes.put('/:id/status', requireRole(['admin']), validateUpdateOrderStatus, OrderController.updateOrderStatus);
orderRoutes.put('/:id/tracking', requireRole(['admin']), validateUpdateTrackingInfo, OrderController.updateTrackingInfo);
orderRoutes.post('/:id/refund', requireRole(['admin']), validateProcessRefund, OrderController.processRefund);