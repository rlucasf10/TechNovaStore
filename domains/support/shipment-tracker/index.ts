/**
 * Punto de entrada principal del servicio de seguimiento de envíos
 * Refactorizado con Screaming Architecture
 */

import express from 'express';
import cron from 'node-cron';
import { connectPostgreSQL } from './config/database';
import { apiRateLimiter } from './shared/middleware/rateLimiter';

// Importar providers
import {
  AmazonTrackingProvider,
  AliExpressTrackingProvider,
  eBayTrackingProvider,
  BanggoodTrackingProvider,
  NeweggTrackingProvider
} from './shared/providers';
import { TrackingProvider } from './shared/types/tracking';

// Importar infraestructura compartida
import { NotificationService } from './shared/clients/NotificationService';

// Importar casos de uso
import { GetTrackingInfo } from './get-tracking-info/GetTrackingInfo';
import { UpdateTrackingInfo } from './update-tracking-info/UpdateTrackingInfo';
import { GetShipmentStatus } from './get-shipment-status/GetShipmentStatus';
import { GetEstimatedDelivery } from './get-estimated-delivery/GetEstimatedDelivery';
import { UpdateAllActiveShipments } from './update-all-active-shipments/UpdateAllActiveShipments';

// Importar API layer
import { TrackingController } from './api/TrackingController';
import { createTrackingRoutes } from './api/routes';

// Importar middleware
import { errorHandler } from './shared/middleware/errorHandler';

// Importar logger
import { logger } from './shared/utils/logger';

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database connection and models
async function initializeDatabase() {
  try {
    await connectPostgreSQL();
    logger.info('Database initialized successfully', { service: 'shipment-tracker' });
  } catch (error) {
    logger.error('Failed to initialize database', { 
      error: error instanceof Error ? error.message : String(error),
      service: 'shipment-tracker'
    });
    process.exit(1);
  }
}

// Initialize providers (LÓGICA ORIGINAL de initializeProviders)
function initializeProviders(): Map<string, TrackingProvider> {
  const providers = new Map<string, TrackingProvider>();
  providers.set('Amazon', new AmazonTrackingProvider(process.env.AMAZON_API_KEY));
  providers.set('AliExpress', new AliExpressTrackingProvider(process.env.ALIEXPRESS_API_KEY));
  providers.set('eBay', new eBayTrackingProvider(process.env.EBAY_API_KEY));
  providers.set('Banggood', new BanggoodTrackingProvider(process.env.BANGGOOD_API_KEY));
  providers.set('Newegg', new NeweggTrackingProvider(process.env.NEWEGG_API_KEY));
  return providers;
}

// Initialize shared infrastructure
const providers = initializeProviders();
const notificationService = new NotificationService();

// Initialize use cases
const getTrackingInfo = new GetTrackingInfo(providers);
const updateTrackingInfo = new UpdateTrackingInfo(providers, notificationService);
const getShipmentStatus = new GetShipmentStatus(getTrackingInfo);
const getEstimatedDelivery = new GetEstimatedDelivery(providers);
const updateAllActiveShipments = new UpdateAllActiveShipments(updateTrackingInfo);

// Initialize API controller
const trackingController = new TrackingController(
  getTrackingInfo,
  updateTrackingInfo,
  getShipmentStatus,
  getEstimatedDelivery
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'shipment-tracker' });
});

// Rate limiting para todas las rutas /api/
// Configuración: 100 requests por 15 minutos por IP
// Requirements: 7.1, 7.2, 7.3, 7.4
app.use('/api', apiRateLimiter);

// Mount tracking routes
const trackingRoutes = createTrackingRoutes(trackingController);
app.use('/api/tracking', trackingRoutes);

// Error handling middleware
app.use(errorHandler);

// Schedule automatic tracking updates every 6 hours (LÓGICA ORIGINAL)
cron.schedule('0 */6 * * *', async () => {
  logger.info('Starting scheduled tracking update', { service: 'shipment-tracker', component: 'cron' });
  try {
    await updateAllActiveShipments.execute();
    logger.info('Scheduled tracking update completed', { service: 'shipment-tracker', component: 'cron' });
  } catch (error) {
    logger.error('Error in scheduled tracking update', { 
      error: error instanceof Error ? error.message : String(error),
      service: 'shipment-tracker',
      component: 'cron'
    });
  }
});

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      logger.info('Shipment Tracker service running', { 
        port: PORT,
        service: 'shipment-tracker',
        architecture: 'Screaming Architecture: Organized by use cases'
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { 
      error: error instanceof Error ? error.message : String(error),
      service: 'shipment-tracker'
    });
    process.exit(1);
  }
}

startServer();

export default app;
