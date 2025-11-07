import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { NotificationService } from './services/NotificationService';
import { EmailService } from './services/EmailService';
import { TemplateService } from './services/TemplateService';
import { SchedulerService } from './services/SchedulerService';
import { config } from './config';

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

// Initialize services
const emailService = new EmailService(config.email);
const templateService = new TemplateService();
const notificationService = new NotificationService(emailService, templateService);
const schedulerService = new SchedulerService(notificationService);

// Start the delay detection scheduler
schedulerService.start();

// Health check endpoint
app.get('/health', (req, res) => {
  return res.json({ status: 'ok', service: 'notification-service' });
});

// Notification endpoints
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

// Shipment status notification endpoint
app.post('/notifications/shipment-status', async (req, res) => {
  try {
    const { orderId, status, trackingNumber, estimatedDelivery, customerEmail } = req.body;
    
    if (!orderId || !status || !customerEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: orderId, status, customerEmail'
      });
    }

    await notificationService.sendShipmentStatusNotification({
      orderId,
      status,
      trackingNumber,
      estimatedDelivery,
      customerEmail
    });
    
    return res.json({
      success: true,
      message: 'Shipment status notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending shipment notification:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send shipment notification'
    });
  }
});

// Delay alert endpoint
app.post('/notifications/delay-alert', async (req, res) => {
  try {
    const { orderId, originalDelivery, newEstimatedDelivery, customerEmail, reason } = req.body;
    
    if (!orderId || !originalDelivery || !newEstimatedDelivery || !customerEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: orderId, originalDelivery, newEstimatedDelivery, customerEmail'
      });
    }

    await notificationService.sendDelayAlert({
      orderId,
      originalDelivery: new Date(originalDelivery),
      newEstimatedDelivery: new Date(newEstimatedDelivery),
      customerEmail,
      reason
    });
    
    return res.json({
      success: true,
      message: 'Delay alert sent successfully'
    });
  } catch (error) {
    console.error('Error sending delay alert:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send delay alert'
    });
  }
});

// Manual delay check endpoint (for testing/admin use)
app.post('/admin/check-delays', async (req, res) => {
  try {
    await schedulerService.triggerDelayCheck();
    return res.json({
      success: true,
      message: 'Delay check completed successfully'
    });
  } catch (error) {
    console.error('Error in manual delay check:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check for delays'
    });
  }
});

const PORT = process.env.PORT || 3005;

const server = app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
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