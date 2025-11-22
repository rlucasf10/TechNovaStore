/**
 * Rutas HTTP del Payment Service
 */

import { Router } from 'express';
import { PaymentController } from './PaymentController';

const router = Router();
const paymentController = new PaymentController();

// Procesar pago
router.post('/process', (req, res) => paymentController.processPaymentHandler(req, res));

// Procesar reembolso
router.post('/:orderId/refund', (req, res) => paymentController.processRefundHandler(req, res));

// Obtener estado de pago
router.get('/:orderId/status', (req, res) => paymentController.getPaymentStatusHandler(req, res));

// Verificar pago
router.get('/verify/:transactionId', (req, res) => paymentController.verifyPaymentHandler(req, res));

export default router;
