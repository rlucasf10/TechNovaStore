/**
 * Controlador de Pedidos
 * 
 * Maneja las peticiones HTTP relacionadas con pedidos.
 */

import { Response } from 'express';
import { validationResult } from 'express-validator';
import { asyncHandler } from '@technovastore/shared-utils';
import { AuthenticatedRequest } from '@technovastore/shared-types';
import { logger } from '../shared/utils/logger';
import { OrderStatus } from '../shared/models/Order';

// Importar casos de uso
import { CreateOrder, CreateOrderData } from '../create-order/CreateOrder';
import { GetOrders, OrderQuery } from '../get-orders/GetOrders';
import { GetOrderById } from '../get-order-by-id/GetOrderById';
import { GetOrderByNumber } from '../get-order-by-number/GetOrderByNumber';
import { UpdateOrderStatus } from '../update-order-status/UpdateOrderStatus';
import { UpdateTrackingInfo } from '../update-tracking-info/UpdateTrackingInfo';
import { GetUserOrders } from '../get-user-orders/GetUserOrders';
import { GetOrderStats } from '../get-order-stats/GetOrderStats';
import { PaymentServiceClient } from '../shared/clients/PaymentServiceClient';
import { UpdatePaymentStatus } from '../update-payment-status/UpdatePaymentStatus';
import { GetOrdersForAutoPurchase } from '../get-orders-for-auto-purchase/GetOrdersForAutoPurchase';
import { MarkOrderForProcessing } from '../mark-order-for-processing/MarkOrderForProcessing';
import { UpdateProviderInfo } from '../update-provider-info/UpdateProviderInfo';
import { ReportAutoPurchaseSuccess } from '../report-auto-purchase-success/ReportAutoPurchaseSuccess';
import { ReportAutoPurchaseFailure } from '../report-auto-purchase-failure/ReportAutoPurchaseFailure';

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

    const createOrder = new CreateOrder();
    const order = await createOrder.execute(orderData);

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

    // Los usuarios no admin solo pueden ver sus propios pedidos
    if (userRole !== 'admin') {
      query.user_id = userId;
    } else if (req.query.user_id) {
      query.user_id = parseInt(req.query.user_id as string);
    }

    const getOrders = new GetOrders();
    const result = await getOrders.execute(query);

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

    const getOrderById = new GetOrderById();
    const order = await getOrderById.execute(parseInt(id));

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    // Los usuarios no admin solo pueden ver sus propios pedidos
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

    const getOrderByNumber = new GetOrderByNumber();
    const order = await getOrderByNumber.execute(orderNumber);

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    // Los usuarios no admin solo pueden ver sus propios pedidos
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

    // Solo los admins pueden actualizar el estado del pedido
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    try {
      const updateOrderStatus = new UpdateOrderStatus();
      const order = await updateOrderStatus.execute(parseInt(id), status);

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

    // Solo los admins pueden actualizar la información de seguimiento
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    const updateTrackingInfo = new UpdateTrackingInfo();
    const order = await updateTrackingInfo.execute(
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

    const getUserOrders = new GetUserOrders();
    const result = await getUserOrders.execute(userId, query);

    return res.json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  });

  static getOrderStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userRole = req.headers['x-user-role'] as string;
    const userId = parseInt(req.headers['x-user-id'] as string);

    // Los usuarios no admin solo pueden ver sus propias estadísticas
    const statsUserId = userRole === 'admin' ? undefined : userId;
    
    const getOrderStats = new GetOrderStats();
    const stats = await getOrderStats.execute(statsUserId);

    return res.json({
      success: true,
      data: stats,
    });
  });

  static cancelOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userRole = req.headers['x-user-role'] as string;
    const userId = parseInt(req.headers['x-user-id'] as string);

    const getOrderById = new GetOrderById();
    const order = await getOrderById.execute(parseInt(id));

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    // Los usuarios solo pueden cancelar sus propios pedidos, y solo si están en estado pending/confirmed
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
      const updateOrderStatus = new UpdateOrderStatus();
      const updatedOrder = await updateOrderStatus.execute(parseInt(id), 'cancelled');

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

    const getOrderById = new GetOrderById();
    const order = await getOrderById.execute(parseInt(id));

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    // Los usuarios solo pueden procesar el pago de sus propios pedidos
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
      // Llamar al Payment Service
      const paymentServiceClient = new PaymentServiceClient();
      const paymentResponse = await paymentServiceClient.processPayment({
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

    // Solo los admins pueden procesar reembolsos
    if (userRole !== 'admin') {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    try {
      // Llamar al Payment Service
      const paymentServiceClient = new PaymentServiceClient();
      const refundResponse = await paymentServiceClient.processRefund(parseInt(id), amount);

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

    const getOrderById = new GetOrderById();
    const order = await getOrderById.execute(parseInt(id));

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    // Los usuarios solo pueden verificar el estado de pago de sus propios pedidos
    if (userRole !== 'admin' && order.user_id !== userId) {
      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    // Devolver información del pedido (el estado de pago está en el pedido)
    return res.json({
      success: true,
      data: {
        paymentStatus: order.payment_status,
        amount: order.total_amount,
      },
    });
  });

  // Endpoint para que el Payment Service actualice el estado de pago
  static updatePaymentStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { paymentStatus, transactionId } = req.body;

    if (!paymentStatus) {
      return res.status(400).json({
        error: 'Payment status is required',
      });
    }

    const updatePaymentStatus = new UpdatePaymentStatus();
    const order = await updatePaymentStatus.execute(parseInt(id), paymentStatus, transactionId);

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    return res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: {
        orderId: order.id,
        paymentStatus: order.payment_status,
        orderStatus: order.status,
      },
    });
  });

  // Endpoints de auto-compra
  static getOrdersForAutoPurchase = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const getOrdersForAutoPurchase = new GetOrdersForAutoPurchase();
    const orders = await getOrdersForAutoPurchase.execute();

    return res.json({
      success: true,
      data: orders,
      count: orders.length,
    });
  });

  static markOrderForProcessing = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const markOrderForProcessing = new MarkOrderForProcessing();
    const order = await markOrderForProcessing.execute(parseInt(id));

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    return res.json({
      success: true,
      message: 'Order marked for processing',
      data: order,
    });
  });

  static updateProviderInfo = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { provider_order_id, provider_name, tracking_number, estimated_delivery, actual_cost } = req.body;

    const updateProviderInfo = new UpdateProviderInfo();
    const order = await updateProviderInfo.execute(parseInt(id), {
      provider_order_id,
      provider_name,
      tracking_number,
      estimated_delivery: estimated_delivery ? new Date(estimated_delivery) : undefined,
      actual_cost,
    });

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    return res.json({
      success: true,
      message: 'Provider info updated successfully',
      data: order,
    });
  });

  static reportAutoPurchaseSuccess = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { provider_order_id, provider_name, total_cost, estimated_delivery } = req.body;

    if (!provider_order_id || !provider_name || total_cost === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: provider_order_id, provider_name, total_cost',
      });
    }

    const reportAutoPurchaseSuccess = new ReportAutoPurchaseSuccess();
    const order = await reportAutoPurchaseSuccess.execute(
      parseInt(id),
      provider_order_id,
      provider_name,
      total_cost,
      estimated_delivery ? new Date(estimated_delivery) : undefined
    );

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    return res.json({
      success: true,
      message: 'Auto-purchase success reported',
      data: order,
    });
  });

  static reportAutoPurchaseFailure = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { error_message, provider_attempts } = req.body;

    if (!error_message || !Array.isArray(provider_attempts)) {
      return res.status(400).json({
        error: 'Missing required fields: error_message, provider_attempts (array)',
      });
    }

    const reportAutoPurchaseFailure = new ReportAutoPurchaseFailure();
    const order = await reportAutoPurchaseFailure.execute(
      parseInt(id),
      error_message,
      provider_attempts
    );

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    return res.json({
      success: true,
      message: 'Auto-purchase failure reported',
      data: order,
    });
  });
}
