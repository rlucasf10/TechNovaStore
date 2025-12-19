/**
 * Rutas HTTP del Payment Service
 */

import { Router } from 'express';
import { PaymentController } from './PaymentController';
import { authMiddleware, requireRole } from '../shared/middleware/auth';

const router = Router();
const paymentController = new PaymentController();

// Procesar pago - Requiere autenticación
router.post('/process', authMiddleware, (req, res) => paymentController.processPaymentHandler(req, res));

// Procesar reembolso - Requiere autenticación y rol admin
router.post('/:orderId/refund', authMiddleware, requireRole(['admin']), (req, res) => paymentController.processRefundHandler(req, res));

// Obtener estado de pago - Requiere autenticación
router.get('/:orderId/status', authMiddleware, (req, res) => paymentController.getPaymentStatusHandler(req, res));

// Verificar pago - Requiere autenticación
router.get('/verify/:transactionId', authMiddleware, (req, res) => paymentController.verifyPaymentHandler(req, res));

export default router;
