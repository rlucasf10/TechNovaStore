/**
 * Rutas del servicio de tickets
 * Extraído de src/routes/ticketRoutes.ts
 * TODOS LOS CASOS DE USO INCLUIDOS
 * 
 * ✅ SEGURIDAD: Todas las rutas protegidas con autenticación (Defense in Depth)
 */

import { Router } from 'express';
import { Pool } from 'pg';
import { TicketController } from './TicketController';
import { authMiddleware, requireRole } from '../shared/middleware/auth';
import { CreateTicket } from '../create-ticket/CreateTicket';
import { CreateTicketFromChatbot } from '../create-ticket-from-chatbot/CreateTicketFromChatbot';
import { GetTicket } from '../get-ticket/GetTicket';
import { UpdateTicket } from '../update-ticket/UpdateTicket';
import { AddMessage } from '../add-message/AddMessage';
import { ResolveTicket } from '../resolve-ticket/ResolveTicket';
import { CloseTicket } from '../close-ticket/CloseTicket';
import { EscalateToHuman } from '../escalate-to-human/EscalateToHuman';
import { GetTicketMessages } from '../get-ticket-messages/GetTicketMessages';
import { CreateSatisfactionSurvey } from '../create-satisfaction-survey/CreateSatisfactionSurvey';
import { SendSatisfactionSurvey } from '../send-satisfaction-survey/SendSatisfactionSurvey';
import { GetSatisfactionMetrics } from '../get-satisfaction-metrics/GetSatisfactionMetrics';
import { GenerateSatisfactionAlerts } from '../generate-satisfaction-alerts/GenerateSatisfactionAlerts';
import { GetSatisfactionTrends } from '../get-satisfaction-trends/GetSatisfactionTrends';
import { AnalyzeFeedbackSentiment } from '../analyze-feedback-sentiment/AnalyzeFeedbackSentiment';
import { GetTicketMetrics } from '../get-ticket-metrics/GetTicketMetrics';
import { GetDetailedMetrics } from '../get-detailed-metrics/GetDetailedMetrics';
import { GetResponseTimeMetrics } from '../get-response-time-metrics/GetResponseTimeMetrics';
import { GetTicketsApproachingSLABreach } from '../get-tickets-approaching-sla-breach/GetTicketsApproachingSLABreach';
import { GetTicketAuditTrail } from '../get-ticket-audit-trail/GetTicketAuditTrail';
import { GetTicketAuditSummary } from '../get-ticket-audit-summary/GetTicketAuditSummary';
import { GetSLABenchmarks } from '../get-sla-benchmarks/GetSLABenchmarks';
import { UpdateSLABenchmark } from '../update-sla-benchmark/UpdateSLABenchmark';
import { AnalyzeForEscalation } from '../analyze-for-escalation/AnalyzeForEscalation';
import { TicketRepository } from '../shared/repositories/TicketRepository';
import { AuditService } from '../shared/utils/AuditService';
import { MetricsService } from '../shared/utils/MetricsService';

export function createTicketRoutes(pool: Pool): Router {
  const router = Router();

  // Initialize repository and services
  const ticketRepository = new TicketRepository(pool);
  const auditService = new AuditService(pool);
  const metricsService = new MetricsService(pool);

  // Initialize ALL use cases
  const createTicket = new CreateTicket(ticketRepository);
  const createTicketFromChatbot = new CreateTicketFromChatbot(createTicket);
  const getTicket = new GetTicket(ticketRepository);
  const updateTicket = new UpdateTicket(ticketRepository);
  const addMessage = new AddMessage(ticketRepository, auditService);
  const resolveTicket = new ResolveTicket(ticketRepository);
  const closeTicket = new CloseTicket(ticketRepository);
  const escalateToHuman = new EscalateToHuman(createTicketFromChatbot, ticketRepository);
  const getTicketMessages = new GetTicketMessages(ticketRepository);
  const createSatisfactionSurvey = new CreateSatisfactionSurvey(ticketRepository);
  const sendSatisfactionSurvey = new SendSatisfactionSurvey(ticketRepository);
  const getSatisfactionMetrics = new GetSatisfactionMetrics(ticketRepository);
  const generateSatisfactionAlerts = new GenerateSatisfactionAlerts(getSatisfactionMetrics);
  const getSatisfactionTrends = new GetSatisfactionTrends();
  const analyzeFeedbackSentiment = new AnalyzeFeedbackSentiment();
  const getTicketMetrics = new GetTicketMetrics(ticketRepository);
  const getDetailedMetrics = new GetDetailedMetrics(metricsService);
  const getResponseTimeMetrics = new GetResponseTimeMetrics(metricsService);
  const getTicketsApproachingSLABreach = new GetTicketsApproachingSLABreach(metricsService);
  const getTicketAuditTrail = new GetTicketAuditTrail(auditService);
  const getTicketAuditSummary = new GetTicketAuditSummary(auditService);
  const getSLABenchmarks = new GetSLABenchmarks(metricsService);
  const updateSLABenchmark = new UpdateSLABenchmark(metricsService);
  const analyzeForEscalation = new AnalyzeForEscalation();

  // Initialize controller with ALL use cases
  const ticketController = new TicketController(
    createTicket,
    createTicketFromChatbot,
    getTicket,
    updateTicket,
    addMessage,
    resolveTicket,
    closeTicket,
    escalateToHuman,
    getTicketMessages,
    createSatisfactionSurvey,
    sendSatisfactionSurvey,
    getSatisfactionMetrics,
    generateSatisfactionAlerts,
    getSatisfactionTrends,
    analyzeFeedbackSentiment,
    getTicketMetrics,
    getDetailedMetrics,
    getResponseTimeMetrics,
    getTicketsApproachingSLABreach,
    getTicketAuditTrail,
    getTicketAuditSummary,
    getSLABenchmarks,
    updateSLABenchmark,
    analyzeForEscalation,
    ticketRepository
  );

  // ✅ SEGURIDAD: Ticket CRUD routes - Requieren autenticación
  router.post('/tickets', authMiddleware, ticketController.createTicketHandler);
  router.get('/tickets', authMiddleware, ticketController.getTicketsHandler);
  router.get('/tickets/:id', authMiddleware, ticketController.getTicketHandler);
  router.get('/tickets/number/:number', authMiddleware, ticketController.getTicketByNumberHandler);
  router.put('/tickets/:id', authMiddleware, ticketController.updateTicketHandler);

  // ✅ SEGURIDAD: Ticket actions - Requieren autenticación
  router.post('/tickets/:id/resolve', authMiddleware, ticketController.resolveTicketHandler);
  router.post('/tickets/:id/close', authMiddleware, ticketController.closeTicketHandler);

  // ✅ SEGURIDAD: Message routes - Requieren autenticación
  router.post('/tickets/:id/messages', authMiddleware, ticketController.addMessageHandler);
  router.get('/tickets/:id/messages', authMiddleware, ticketController.getMessagesHandler);

  // ✅ SEGURIDAD: Satisfaction survey routes - Requieren autenticación
  router.post('/tickets/:id/satisfaction', authMiddleware, ticketController.createSatisfactionSurveyHandler);
  router.post('/tickets/:id/satisfaction/send', authMiddleware, ticketController.sendSatisfactionSurveyHandler);

  // ✅ SEGURIDAD: Escalation routes - Requieren autenticación
  router.post('/escalate', authMiddleware, ticketController.escalateFromChatbotHandler);

  // ✅ SEGURIDAD: Metrics routes - Requieren autenticación + rol admin
  router.get('/metrics/tickets', authMiddleware, requireRole(['admin']), ticketController.getMetricsHandler);
  router.get('/metrics/detailed', authMiddleware, requireRole(['admin']), ticketController.getDetailedMetricsHandler);
  router.get('/metrics/response-time', authMiddleware, requireRole(['admin']), ticketController.getResponseTimeMetricsHandler);
  router.get('/metrics/satisfaction', authMiddleware, requireRole(['admin']), ticketController.getSatisfactionMetricsHandler);
  router.get('/metrics/sla-breaches', authMiddleware, requireRole(['admin']), ticketController.getTicketsApproachingSLABreachHandler);

  // ✅ SEGURIDAD: Audit routes - Requieren autenticación
  router.get('/tickets/:id/audit', authMiddleware, ticketController.getTicketAuditTrailHandler);
  router.get('/tickets/:id/audit/summary', authMiddleware, ticketController.getTicketAuditSummaryHandler);

  // ✅ SEGURIDAD: SLA management routes - Requieren autenticación + rol admin
  router.get('/sla/benchmarks', authMiddleware, requireRole(['admin']), ticketController.getSLABenchmarksHandler);
  router.put('/sla/benchmarks', authMiddleware, requireRole(['admin']), ticketController.updateSLABenchmarkHandler);

  return router;
}
