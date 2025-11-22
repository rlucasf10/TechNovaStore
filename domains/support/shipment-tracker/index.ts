/**
 * Punto de entrada principal del servicio de seguimiento de envíos
 * Refactorizado con Screaming Architecture
 */

import express from 'express';
import cron from 'node-cron';
import { connectPostgreSQL } from './config/database';

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

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database connection and models
async function initializeDatabase() {
  try {
    await connectPostgreSQL();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
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

// Mount tracking routes
const trackingRoutes = createTrackingRoutes(trackingController);
app.use('/api/tracking', trackingRoutes);

// Error handling middleware
app.use(errorHandler);

// Schedule automatic tracking updates every 6 hours (LÓGICA ORIGINAL)
cron.schedule('0 */6 * * *', async () => {
  console.log('Starting scheduled tracking update...');
  try {
    await updateAllActiveShipments.execute();
    console.log('Scheduled tracking update completed');
  } catch (error) {
    console.error('Error in scheduled tracking update:', error);
  }
});

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`Shipment Tracker service running on port ${PORT}`);
      console.log('Screaming Architecture: Organized by use cases');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
