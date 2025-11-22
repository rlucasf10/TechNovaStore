/**
 * Rutas del servicio de tickets
 * Extraído de src/routes/ticketRoutes.ts
 * TODOS LOS CASOS DE USO INCLUIDOS
 */

import { Router } from 'express';
import { Pool } from 'pg';
import { TicketController } from './TicketController';
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

  // Ticket CRUD routes
  router.post('/tickets', ticketController.createTicketHandler);
  router.get('/tickets', ticketController.getTicketsHandler);
  router.get('/tickets/:id', ticketController.getTicketHandler);
  router.get('/tickets/number/:number', ticketController.getTicketByNumberHandler);
  router.put('/tickets/:id', ticketController.updateTicketHandler);

  // Ticket actions
  router.post('/tickets/:id/resolve', ticketController.resolveTicketHandler);
  router.post('/tickets/:id/close', ticketController.closeTicketHandler);

  // Message routes
  router.post('/tickets/:id/messages', ticketController.addMessageHandler);
  router.get('/tickets/:id/messages', ticketController.getMessagesHandler);

  // Satisfaction survey routes
  router.post('/tickets/:id/satisfaction', ticketController.createSatisfactionSurveyHandler);
  router.post('/tickets/:id/satisfaction/send', ticketController.sendSatisfactionSurveyHandler);

  // Escalation routes
  router.post('/escalate', ticketController.escalateFromChatbotHandler);

  // Metrics routes
  router.get('/metrics/tickets', ticketController.getMetricsHandler);
  router.get('/metrics/detailed', ticketController.getDetailedMetricsHandler);
  router.get('/metrics/response-time', ticketController.getResponseTimeMetricsHandler);
  router.get('/metrics/satisfaction', ticketController.getSatisfactionMetricsHandler);
  router.get('/metrics/sla-breaches', ticketController.getTicketsApproachingSLABreachHandler);

  // Audit routes
  router.get('/tickets/:id/audit', ticketController.getTicketAuditTrailHandler);
  router.get('/tickets/:id/audit/summary', ticketController.getTicketAuditSummaryHandler);

  // SLA management routes
  router.get('/sla/benchmarks', ticketController.getSLABenchmarksHandler);
  router.put('/sla/benchmarks', ticketController.updateSLABenchmarkHandler);

  return router;
}
