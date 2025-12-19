/**
 * Entry Point - Chatbot Service
 * 
 * Este archivo inicializa y conecta todos los casos de uso,
 * configura el servidor Express y maneja el ciclo de vida del servicio
 */

import express from 'express';
import { createServer } from 'http';
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
import { MetricsCollector } from './shared/MetricsCollector';

// API
import { ChatbotController } from './api/ChatbotController';
import { createRoutes } from './api/routes';
import { SocketServer } from './api/SocketServer';

// Logger
import { logger } from './shared/utils/logger';

/**
 * Inicializa todas las dependencias y casos de uso
 */
function initializeDependencies() {
  logger.info('Inicializando dependencias del chatbot');

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
  const metricsCollector = new MetricsCollector();

  // Controlador
  const controller = new ChatbotController(
    processMessage,
    manageSession,
    escalateToHuman,
    metricsCollector
  );

  logger.info('Dependencias inicializadas correctamente');

  return { controller, escalationService, processMessage, manageSession, metricsCollector };
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
  logger.info('Iniciando Chatbot Service');
  logger.info('Modo de operación', { mode: config.useOllama ? 'Ollama' : 'Fallback' });

  // Inicializar dependencias
  const { controller, escalationService, processMessage, manageSession, metricsCollector } = initializeDependencies();

  // Configurar servidor Express
  const app = setupServer(controller);

  // Crear servidor HTTP
  const httpServer = createServer(app);

  // Configurar Socket.IO
  const socketServer = new SocketServer(
    httpServer,
    processMessage,
    manageSession,
    config.frontendUrl,
    metricsCollector
  );

  logger.info('Socket.IO configurado');

  // Iniciar servidor
  const server = httpServer.listen(config.port, () => {
    logger.info('Chatbot service iniciado', { 
      port: config.port,
      healthCheck: `http://localhost:${config.port}/health`,
      httpApi: `http://localhost:${config.port}/api/chat`,
      socketApi: `ws://localhost:${config.port}`
    });
    logger.info('Chatbot Service Ready');
  });

  // Limpieza periódica de conversaciones antiguas
  setInterval(() => {
    escalationService.cleanupOldConversations();
  }, config.sessionCleanupInterval);

  // Manejo de señales de terminación
  const gracefulShutdown = () => {
    logger.info('Señal de apagado recibida, cerrando servidor...');
    server.close(() => {
      logger.info('Servidor cerrado');
      process.exit(0);
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  // Manejo de errores no capturados
  process.on('uncaughtException', (error) => {
    logger.error('Excepción no capturada', { error: error.message, stack: error.stack });
    gracefulShutdown();
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Promesa rechazada no manejada', { reason, promise });
    gracefulShutdown();
  });
}

// Iniciar el servicio
startService();

export { ProcessMessage, ManageSession, EscalateToHuman };
