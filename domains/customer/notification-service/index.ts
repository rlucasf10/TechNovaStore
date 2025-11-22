/**
 * Punto de entrada principal del servicio de notificaciones
 * Refactorizado con Screaming Architecture
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Importar infraestructura compartida
import { EmailService } from './shared/email/EmailService';
import { TemplateService } from './shared/templates/TemplateService';
import { config } from './config';

// Importar casos de uso
import { SendOrderConfirmation } from './send-order-confirmation/SendOrderConfirmation';
import { SendPaymentConfirmation } from './send-payment-confirmation/SendPaymentConfirmation';
import { SendShipmentStatus } from './send-shipment-status/SendShipmentStatus';
import { SendDelayAlert } from './send-delay-alert/SendDelayAlert';
import { SendOrderCancellation } from './send-order-cancellation/SendOrderCancellation';
import { SendInvoiceGenerated } from './send-invoice-generated/SendInvoiceGenerated';
import { CheckDeliveryDelays } from './check-delivery-delays/CheckDeliveryDelays';

// Importar API layer
import { NotificationController } from './api/NotificationController';
import { createNotificationRoutes } from './api/routes';

// Importar scheduler (mantener funcionalidad original)
import { SchedulerService } from './shared/services/SchedulerService';
import { NotificationService } from './shared/services/NotificationService';

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.CORS_ORIGINS || 'https://technovastore.com').split(',')
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3011'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'X-Session-ID', 'X-User-ID', 'X-User-Role'],
  exposedHeaders: ['X-CSRF-Token'],
  maxAge: 86400,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize shared infrastructure
const emailService = new EmailService(config.email);
const templateService = new TemplateService();

// Initialize use cases
const sendOrderConfirmation = new SendOrderConfirmation(emailService, templateService);
const sendPaymentConfirmation = new SendPaymentConfirmation(emailService, templateService);
const sendShipmentStatus = new SendShipmentStatus(emailService, templateService);
const sendDelayAlert = new SendDelayAlert(emailService, templateService);
const sendOrderCancellation = new SendOrderCancellation(emailService, templateService);
const sendInvoiceGenerated = new SendInvoiceGenerated(emailService, templateService);
const checkDeliveryDelays = new CheckDeliveryDelays(sendDelayAlert);

// Initialize API controller
const notificationController = new NotificationController(
  sendOrderConfirmation,
  sendPaymentConfirmation,
  sendShipmentStatus,
  sendDelayAlert,
  sendOrderCancellation,
  sendInvoiceGenerated,
  checkDeliveryDelays
);

// Initialize scheduler (mantener funcionalidad original)
const notificationService = new NotificationService(emailService, templateService);
const schedulerService = new SchedulerService(emailService, templateService);
schedulerService.start();

// Health check endpoint
app.get('/health', (req, res) => {
  return res.json({ status: 'ok', service: 'notification-service' });
});

// Mount notification routes
const notificationRoutes = createNotificationRoutes(notificationController);
app.use('/api/notifications', notificationRoutes);

// Legacy endpoints (mantener compatibilidad con código existente)
app.post('/notifications/email', async (req, res) => {
  try {
    const { type, recipient, data } = req.body;
    
    if (!type || !recipient || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, recipient, data'
      });
    }

    await notificationService.sendNotification(type, recipient, data);
    
    return res.json({
      success: true,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send notification'
    });
  }
});

app.post('/notifications/shipment-status', async (req, res) => {
  try {
    const data = req.body;
    await sendShipmentStatus.execute(data);
    return res.json({ success: true, message: 'Shipment status notification sent successfully' });
  } catch (error) {
    console.error('Error sending shipment notification:', error);
    return res.status(500).json({ success: false, error: 'Failed to send shipment notification' });
  }
});

app.post('/notifications/delay-alert', async (req, res) => {
  try {
    const data = req.body;
    data.originalDelivery = new Date(data.originalDelivery);
    data.newEstimatedDelivery = new Date(data.newEstimatedDelivery);
    await sendDelayAlert.execute(data);
    return res.json({ success: true, message: 'Delay alert sent successfully' });
  } catch (error) {
    console.error('Error sending delay alert:', error);
    return res.status(500).json({ success: false, error: 'Failed to send delay alert' });
  }
});

app.post('/admin/check-delays', async (req, res) => {
  try {
    await schedulerService.triggerDelayCheck();
    return res.json({ success: true, message: 'Delay check completed successfully' });
  } catch (error) {
    console.error('Error in manual delay check:', error);
    return res.status(500).json({ success: false, error: 'Failed to check for delays' });
  }
});

const PORT = process.env.PORT || 3005;

const server = app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
  console.log('Screaming Architecture: Organized by use cases');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  schedulerService.stop();
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  schedulerService.stop();
  server.close(() => {
    console.log('Process terminated');
  });
});

export default app;
