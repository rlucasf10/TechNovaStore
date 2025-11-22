/**
 * Entry Point - Chatbot Service
 * 
 * Este archivo inicializa y conecta todos los casos de uso,
 * configura el servidor Express y maneja el ciclo de vida del servicio
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';

// Casos de uso
import { ProcessMessage } from './process-message/ProcessMessage';
import { ProcessWithOllama } from './process-with-ollama/ProcessWithOllama';
import { UseSimpleFallback } from './use-simple-fallback/UseSimpleFallback';
import { RetrieveProductsRAG } from './retrieve-products-rag/RetrieveProductsRAG';
import { GenerateResponse } from './generate-response/GenerateResponse';
import { ManageSession } from './manage-session/ManageSession';
import { EscalateToHuman } from './escalate-to-human/EscalateToHuman';

// Infraestructura compartida
import { OllamaAdapter } from './shared/clients/OllamaAdapter';
import { SimpleFallbackRecognizer } from './shared/recognizers/SimpleFallbackRecognizer';
import { ProductKnowledgeBase } from './shared/knowledge/ProductKnowledgeBase';
import { KeywordExtractor } from './shared/rag/KeywordExtractor';
import { NLPProcessor } from './shared/nlp/NLPProcessor';
import { EscalationIntegration } from './shared/services/EscalationIntegration';

// API
import { ChatbotController } from './api/ChatbotController';
import { createRoutes } from './api/routes';

/**
 * Inicializa todas las dependencias y casos de uso
 */
function initializeDependencies() {
  console.log('Inicializando dependencias del chatbot...');

  // Infraestructura compartida
  const ollamaAdapter = new OllamaAdapter({
    host: config.ollamaHost,
    model: config.ollamaModel,
    timeout: config.ollamaTimeout,
    temperature: config.ollamaTemperature,
    maxTokens: config.ollamaMaxTokens
  });

  const simpleFallbackRecognizer = new SimpleFallbackRecognizer();
  const knowledgeBase = new ProductKnowledgeBase();
  const keywordExtractor = new KeywordExtractor();
  const nlpProcessor = new NLPProcessor();
  const escalationService = new EscalationIntegration();

  // Casos de uso
  const retrieveProductsRAG = new RetrieveProductsRAG(knowledgeBase, keywordExtractor);
  const generateResponse = new GenerateResponse(knowledgeBase, nlpProcessor);

  const processWithOllama = new ProcessWithOllama(
    ollamaAdapter,
    retrieveProductsRAG,
    simpleFallbackRecognizer
  );

  const useSimpleFallback = new UseSimpleFallback(
    retrieveProductsRAG,
    simpleFallbackRecognizer,
    generateResponse
  );

  const processMessage = new ProcessMessage(
    processWithOllama,
    useSimpleFallback,
    ollamaAdapter,
    escalationService
  );

  const manageSession = new ManageSession();
  const escalateToHuman = new EscalateToHuman(escalationService);

  // Controlador
  const controller = new ChatbotController(
    processMessage,
    manageSession,
    escalateToHuman
  );

  console.log('✓ Dependencias inicializadas correctamente');

  return { controller, escalationService };
}

/**
 * Configura el servidor Express
 */
function setupServer(controller: ChatbotController) {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors({
    origin: config.frontendUrl,
    credentials: true
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Timeout para requests
  app.use((req, res, next) => {
    req.setTimeout(60000); // 60 segundos
    res.setTimeout(60000);
    next();
  });

  // Rutas
  const routes = createRoutes(controller);
  app.use(routes);

  return app;
}

/**
 * Inicia el servicio
 */
function startService() {
  console.log('=== Iniciando Chatbot Service ===');
  console.log(`Modo: ${config.useOllama ? 'Ollama' : 'Fallback'}`);

  // Inicializar dependencias
  const { controller, escalationService } = initializeDependencies();

  // Configurar servidor
  const app = setupServer(controller);

  // Iniciar servidor
  const server = app.listen(config.port, () => {
    console.log(`✓ Chatbot service running on port ${config.port}`);
    console.log(`✓ Health check: http://localhost:${config.port}/health`);
    console.log(`✓ Chat API: http://localhost:${config.port}/api/chat`);
    console.log('=== Chatbot Service Ready ===');
  });

  // Limpieza periódica de conversaciones antiguas
  setInterval(() => {
    escalationService.cleanupOldConversations();
  }, config.sessionCleanupInterval);

  // Manejo de señales de terminación
  const gracefulShutdown = () => {
    console.log('\nReceived shutdown signal, closing server gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  // Manejo de errores no capturados
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown();
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown();
  });
}

// Iniciar el servicio
startService();

export { ProcessMessage, ManageSession, EscalateToHuman };
