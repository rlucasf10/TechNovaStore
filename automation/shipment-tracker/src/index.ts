import express from 'express';
import cron from 'node-cron';
import { connectPostgreSQL } from './config/database';
import { ShipmentTracker } from './services/ShipmentTracker';
import { TrackingController } from './controllers/TrackingController';
import { errorHandler } from './middleware/errorHandler';

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

// Initialize shipment tracker
const shipmentTracker = new ShipmentTracker();
const trackingController = new TrackingController(shipmentTracker);

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'shipment-tracker' });
});

app.get('/api/tracking/:orderNumber', trackingController.getTrackingInfo.bind(trackingController));
app.post('/api/tracking/update/:orderNumber', trackingController.updateTracking.bind(trackingController));
app.get('/api/tracking/status/:orderNumber', trackingController.getShipmentStatus.bind(trackingController));
app.get('/api/tracking/estimate/:orderNumber', trackingController.getEstimatedDelivery.bind(trackingController));

// Error handling middleware
app.use(errorHandler);

// Schedule automatic tracking updates every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('Starting scheduled tracking update...');
  try {
    await shipmentTracker.updateAllActiveShipments();
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
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();