import { ChatbotService } from './ChatbotService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize and start the chatbot service
const port = parseInt(process.env.CHATBOT_PORT || '3001', 10);
const chatbotService = new ChatbotService(port);

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  chatbotService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  chatbotService.stop();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  chatbotService.stop();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  chatbotService.stop();
  process.exit(1);
});

// Start the service
chatbotService.start();

export { ChatbotService };