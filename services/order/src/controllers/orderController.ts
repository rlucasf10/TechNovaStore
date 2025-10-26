import { Response } from 'express';
import { validationResult } from 'express-validator';
import { OrderService, CreateOrderData, OrderQuery } from '../services/orderService';
import { PaymentService } from '../services/paymentService';
import { OrderStatus } from '../models/Order';
import { asyncHandler } from '../../../../shared/middleware/errorHandler';
import { AuthenticatedRequest } from '@technovastore/shared-types';
import { logger } from '../utils/logger';

export class OrderController {
  static createOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const userId = parseInt(req.headers['x-user-id'] as string);
    
    const orderData: CreateOrderData = {
      ...req.body,
      user_id: userId,
    };

    const order = await OrderService.createOrder(orderData);

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  });

  static getOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = req.headers['x-user-role'] as string;
    const userId = parseInt(req.headers['x-user-id'] as string);

    const query: OrderQuery = {
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
      status: req.query.status as OrderStatus,
      sortBy: req.query.sortBy as string || 'created_at',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    // Non-admin users can only see their own orders
    if (userRole !== 'admin') {
      query.user_id = userId;
    } else if (req.query.user_id) {
      query.user_id = parseInt(req.query.user_id as string);
    }

    const result = await OrderService.getOrders(query);

    return res.json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  });

  static getOrderById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userRole = req.headers['x-user-role'] as string;
    const userId = parseInt(req.headers['x-user-id'] as string);

    const order = await OrderService.getOrderById(parseInt(id));

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    // Non-admin users can only view their own orders
    if (userRole !== 'admin' && order.user_id !== userId) {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    return res.json({
      success: true,
      data: order,
    });
  });

  static getOrderByNumber = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { orderNumber } = req.params;
    const userRole = req.headers['x-user-role'] as string;
    const userId = parseInt(req.headers['x-user-id'] as string);

    const order = await OrderService.getOrderByNumber(orderNumber);

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    // Non-admin users can only view their own orders
    if (userRole !== 'admin' && order.user_id !== userId) {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    return res.json({
      success: true,
      data: order,
    });
  });

  static updateOrderStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.headers['x-user-role'] as string;

    // Only admins can update order status
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    try {
      const order = await OrderService.updateOrderStatus(parseInt(id), status);

      if (!order) {
        return res.status(404).json({
          error: 'Order not found',
        });
      }

      return res.json({
        success: true,
        message: 'Order status updated successfully',
        data: order,
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message,
      });
    }
  });

  static updateTrackingInfo = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { id } = req.params;
    const { tracking_number, estimated_delivery } = req.body;
    const userRole = req.headers['x-user-role'] as string;

    // Only admins can update tracking info
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    const order = await OrderService.updateTrackingInfo(
      parseInt(id),
      tracking_number,
      estimated_delivery ? new Date(estimated_delivery) : undefined
    );

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    return res.json({
      success: true,
      message: 'Tracking information updated successfully',
      data: order,
    });
  });

  static getUserOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = parseInt(req.headers['x-user-id'] as string);

    const query: Omit<OrderQuery, 'user_id'> = {
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
      status: req.query.status as OrderStatus,
      sortBy: req.query.sortBy as string || 'created_at',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await OrderService.getUserOrders(userId, query);

    return res.json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  });

  static getOrderStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = req.headers['x-user-role'] as string;
    const userId = parseInt(req.headers['x-user-id'] as string);

    // Non-admin users can only see their own stats
    const statsUserId = userRole === 'admin' ? undefined : userId;
    
    const stats = await OrderService.getOrderStats(statsUserId);

    return res.json({
      success: true,
      data: stats,
    });
  });

  static cancelOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userRole = req.headers['x-user-role'] as string;
    const userId = parseInt(req.headers['x-user-id'] as string);

    const order = await OrderService.getOrderById(parseInt(id));

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    // Users can only cancel their own orders, and only if they're in pending/confirmed status
    if (userRole !== 'admin' && order.user_id !== userId) {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        error: 'Order cannot be cancelled in current status',
      });
    }

    try {
      const updatedOrder = await OrderService.updateOrderStatus(parseInt(id), 'cancelled');

      return res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: updatedOrder,
      });
    } catch (error: any) {
      return res.status(400).json({
        error: error.message,
      });
    }
  });

  static processPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { id } = req.params;
    const { customerInfo } = req.body;
    const userRole = req.headers['x-user-role'] as string;
    const userId = parseInt(req.headers['x-user-id'] as string);

    const order = await OrderService.getOrderById(parseInt(id));

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    // Users can only process payment for their own orders
    if (userRole !== 'admin' && order.user_id !== userId) {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    if (order.payment_status !== 'pending') {
      return res.status(400).json({
        error: 'Payment has already been processed or is not in pending status',
      });
    }

    try {
      const paymentResponse = await PaymentService.processPayment({
        orderId: order.id,
        amount: order.total_amount,
        currency: 'EUR',
        paymentMethod: order.payment_method,
        customerInfo,
        billingAddress: order.billing_address,
      });

      if (paymentResponse.success) {
        return res.json({
          success: true,
          message: 'Payment processed successfully',
          data: {
            transactionId: paymentResponse.transactionId,
            paymentStatus: paymentResponse.paymentStatus,
          },
        });
      } else {
        return res.status(400).json({
          success: false,
          error: paymentResponse.message,
          errorCode: paymentResponse.errorCode,
        });
      }
    } catch (error: any) {
      logger.error('Payment processing error:', error);
      return res.status(500).json({
        error: 'Payment processing failed',
      });
    }
  });

  static processRefund = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { amount } = req.body;
    const userRole = req.headers['x-user-role'] as string;

    // Only admins can process refunds
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    try {
      const refundResponse = await PaymentService.processRefund(parseInt(id), amount);

      if (refundResponse.success) {
        return res.json({
          success: true,
          message: 'Refund processed successfully',
          data: {
            transactionId: refundResponse.transactionId,
            paymentStatus: refundResponse.paymentStatus,
          },
        });
      } else {
        return res.status(400).json({
          success: false,
          error: refundResponse.message,
          errorCode: refundResponse.errorCode,
        });
      }
    } catch (error: any) {
      logger.error('Refund processing error:', error);
      return res.status(500).json({
        error: 'Refund processing failed',
      });
    }
  });

  static getPaymentStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userRole = req.headers['x-user-role'] as string;
    const userId = parseInt(req.headers['x-user-id'] as string);

    const order = await OrderService.getOrderById(parseInt(id));

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    // Users can only check payment status for their own orders
    if (userRole !== 'admin' && order.user_id !== userId) {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    const paymentStatus = await PaymentService.getPaymentStatus(parseInt(id));

    if (!paymentStatus) {
      return res.status(404).json({
        error: 'Payment information not found',
      });
    }

    return res.json({
      success: true,
      data: paymentStatus,
    });
  });
}