import { Router } from 'express';
import { TicketController } from '../controllers/TicketController';
import { TicketService } from '../services/TicketService';
import { EscalationService } from '../services/EscalationService';
import { SatisfactionService } from '../services/SatisfactionService';
import pool from '../config/database';

const router = Router();

// Initialize services
const ticketService = new TicketService(pool);
const escalationService = new EscalationService(ticketService);
const satisfactionService = new SatisfactionService(ticketService);

// Initialize controller
const ticketController = new TicketController(
  ticketService,
  escalationService,
  satisfactionService
);

// Ticket CRUD routes
router.post('/tickets', ticketController.createTicket);
router.get('/tickets', ticketController.getTickets);
router.get('/tickets/:id', ticketController.getTicket);
router.get('/tickets/number/:number', ticketController.getTicketByNumber);
router.put('/tickets/:id', ticketController.updateTicket);

// Ticket actions
router.post('/tickets/:id/resolve', ticketController.resolveTicket);
router.post('/tickets/:id/close', ticketController.closeTicket);

// Message routes
router.post('/tickets/:id/messages', ticketController.addMessage);
router.get('/tickets/:id/messages', ticketController.getMessages);

// Satisfaction survey routes
router.post('/tickets/:id/satisfaction', ticketController.createSatisfactionSurvey);

// Escalation routes
router.post('/escalate', ticketController.escalateFromChatbot);

// Metrics routes
router.get('/metrics/tickets', ticketController.getMetrics);
router.get('/metrics/detailed', ticketController.getDetailedMetrics);
router.get('/metrics/response-time', ticketController.getResponseTimeMetrics);
router.get('/metrics/satisfaction', ticketController.getSatisfactionMetrics);
router.get('/metrics/sla-breaches', ticketController.getTicketsApproachingSLABreach);

// Audit routes
router.get('/tickets/:id/audit', ticketController.getTicketAuditTrail);
router.get('/tickets/:id/audit/summary', ticketController.getTicketAuditSummary);

// SLA management routes
router.get('/sla/benchmarks', ticketController.getSLABenchmarks);
router.put('/sla/benchmarks', ticketController.updateSLABenchmark);

export default router;