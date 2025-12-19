/**
 * Controlador de Tickets
 * Extraído de src/controllers/TicketController.ts
 * Adaptado para usar casos de uso
 * 
 * ✅ SEGURIDAD: Verificación de propiedad de recursos implementada
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '@technovastore/shared-types';
import { logger } from '../shared/utils/logger';
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
import {
  CreateTicketRequest,
  UpdateTicketRequest,
  AddMessageRequest,
  CreateSatisfactionSurveyRequest,
  TicketStatus,
  TicketCategory,
  TicketPriority
} from '../shared/types';

export class TicketController {
  constructor(
    private createTicket: CreateTicket,
    private createTicketFromChatbot: CreateTicketFromChatbot,
    private getTicket: GetTicket,
    private updateTicket: UpdateTicket,
    private addMessage: AddMessage,
    private resolveTicket: ResolveTicket,
    private closeTicket: CloseTicket,
    private escalateToHuman: EscalateToHuman,
    private getTicketMessages: GetTicketMessages,
    private createSatisfactionSurvey: CreateSatisfactionSurvey,
    private sendSatisfactionSurvey: SendSatisfactionSurvey,
    private getSatisfactionMetrics: GetSatisfactionMetrics,
    private generateSatisfactionAlerts: GenerateSatisfactionAlerts,
    private getSatisfactionTrends: GetSatisfactionTrends,
    private analyzeFeedbackSentiment: AnalyzeFeedbackSentiment,
    private getTicketMetrics: GetTicketMetrics,
    private getDetailedMetrics: GetDetailedMetrics,
    private getResponseTimeMetrics: GetResponseTimeMetrics,
    private getTicketsApproachingSLABreach: GetTicketsApproachingSLABreach,
    private getTicketAuditTrail: GetTicketAuditTrail,
    private getTicketAuditSummary: GetTicketAuditSummary,
    private getSLABenchmarks: GetSLABenchmarks,
    private updateSLABenchmark: UpdateSLABenchmark,
    private analyzeForEscalation: AnalyzeForEscalation,
    private ticketRepository: TicketRepository
  ) {}

  /**
   * ✅ SEGURIDAD: Verifica que el usuario tiene permiso para acceder al ticket
   * - Los usuarios solo pueden acceder a sus propios tickets
   * - Los admins pueden acceder a todos los tickets
   */
  private async verifyTicketOwnership(
    ticketId: number,
    userId: string,
    userRole: string,
    res: Response
  ): Promise<boolean> {
    const ticket = await this.getTicket.executeById(ticketId);
    
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return false;
    }

    // Los admins pueden acceder a todos los tickets
    if (userRole === 'admin') {
      return true;
    }

    // Verificar que el ticket pertenece al usuario
    if (ticket.user_id && ticket.user_id.toString() !== userId) {
      logger.warn('Unauthorized ticket access attempt', {
        userId,
        ticketId,
        ticketOwnerId: ticket.user_id,
      });
      
      res.status(403).json({ error: 'Access denied' });
      return false;
    }

    return true;
  }

  createTicketHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const ticketData: CreateTicketRequest = req.body;
      
      if (!ticketData.customer_email || !ticketData.customer_name || 
          !ticketData.subject || !ticketData.description) {
        res.status(400).json({
          error: 'Missing required fields: customer_email, customer_name, subject, description'
        });
        return;
      }

      const ticket = await this.createTicket.execute(ticketData);
      
      res.status(201).json({
        success: true,
        data: ticket
      });
    } catch (error) {
      logger.error('Error creating ticket:', error);
      res.status(500).json({
        error: 'Failed to create ticket'
      });
    }
  };

  getTicketHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const ticketId = parseInt(req.params.id);
      
      if (isNaN(ticketId)) {
        res.status(400).json({ error: 'Invalid ticket ID' });
        return;
      }

      // ✅ SEGURIDAD: Verificar propiedad del ticket
      const hasAccess = await this.verifyTicketOwnership(
        ticketId,
        req.user!.id,
        req.user!.role,
        res
      );
      
      if (!hasAccess) {
        return;
      }

      const ticket = await this.getTicket.executeById(ticketId);
      
      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      logger.error('Error getting ticket:', error);
      res.status(500).json({
        error: 'Failed to get ticket'
      });
    }
  };

  getTicketByNumberHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const ticketNumber = req.params.number;
      
      const ticket = await this.getTicket.executeByNumber(ticketNumber);
      
      if (!ticket) {
        res.status(404).json({ error: 'Ticket not found' });
        return;
      }

      // ✅ SEGURIDAD: Verificar propiedad del ticket
      if (req.user!.role !== 'admin' && ticket.user_id && ticket.user_id.toString() !== req.user!.id) {
        logger.warn('Unauthorized ticket access attempt', {
          userId: req.user!.id,
          ticketId: ticket.id,
          ticketOwnerId: ticket.user_id,
        });
        
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      logger.error('Error getting ticket by number:', error);
      res.status(500).json({
        error: 'Failed to get ticket'
      });
    }
  };

  updateTicketHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const ticketId = parseInt(req.params.id);
      const updateData: UpdateTicketRequest = req.body;
      
      if (isNaN(ticketId)) {
        res.status(400).json({ error: 'Invalid ticket ID' });
        return;
      }

      // ✅ SEGURIDAD: Verificar propiedad del ticket
      const hasAccess = await this.verifyTicketOwnership(
        ticketId,
        req.user!.id,
        req.user!.role,
        res
      );
      
      if (!hasAccess) {
        return;
      }

      const ticket = await this.updateTicket.execute(ticketId, updateData);
      
      if (!ticket) {
        res.status(404).json({ error: 'Ticket not found' });
        return;
      }

      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      logger.error('Error updating ticket:', error);
      res.status(500).json({
        error: 'Failed to update ticket'
      });
    }
  };

  getTicketsHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as TicketStatus;
      const category = req.query.category as TicketCategory;
      const priority = req.query.priority as TicketPriority;
      const assignedTo = req.query.assigned_to ? parseInt(req.query.assigned_to as string) : undefined;

      // ✅ SEGURIDAD: Los usuarios no-admin solo pueden ver sus propios tickets
      let result;
      if (req.user!.role === 'admin') {
        result = await this.ticketRepository.getTickets(
          page, limit, status, category, priority, assignedTo
        );
      } else {
        // Filtrar por user_id del usuario autenticado
        result = await this.ticketRepository.getTicketsByUserId(
          parseInt(req.user!.id),
          page,
          limit,
          status,
          category,
          priority
        );
      }

      res.json({
        success: true,
        data: result.tickets,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      logger.error('Error getting tickets:', error);
      res.status(500).json({
        error: 'Failed to get tickets'
      });
    }
  };

  addMessageHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const ticketId = parseInt(req.params.id);
      const messageData: AddMessageRequest = req.body;
      
      if (isNaN(ticketId)) {
        res.status(400).json({ error: 'Invalid ticket ID' });
        return;
      }

      if (!messageData.message || !messageData.sender_name) {
        res.status(400).json({
          error: 'Missing required fields: message, sender_name'
        });
        return;
      }

      // ✅ SEGURIDAD: Verificar propiedad del ticket
      const hasAccess = await this.verifyTicketOwnership(
        ticketId,
        req.user!.id,
        req.user!.role,
        res
      );
      
      if (!hasAccess) {
        return;
      }

      const message = await this.addMessage.execute(ticketId, messageData);
      
      res.status(201).json({
        success: true,
        data: message
      });
    } catch (error) {
      logger.error('Error adding message:', error);
      res.status(500).json({
        error: 'Failed to add message'
      });
    }
  };

  getMessagesHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const ticketId = parseInt(req.params.id);
      const includeInternal = req.query.include_internal === 'true';
      
      if (isNaN(ticketId)) {
        res.status(400).json({ error: 'Invalid ticket ID' });
        return;
      }

      // ✅ SEGURIDAD: Verificar propiedad del ticket
      const hasAccess = await this.verifyTicketOwnership(
        ticketId,
        req.user!.id,
        req.user!.role,
        res
      );
      
      if (!hasAccess) {
        return;
      }

      const messages = await this.getTicketMessages.execute(ticketId, includeInternal);
      
      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      logger.error('Error getting messages:', error);
      res.status(500).json({
        error: 'Failed to get messages'
      });
    }
  };

  resolveTicketHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const ticketId = parseInt(req.params.id);
      const { resolution_message, agent_id, agent_name } = req.body;
      
      if (isNaN(ticketId)) {
        res.status(400).json({ error: 'Invalid ticket ID' });
        return;
      }

      if (!resolution_message) {
        res.status(400).json({ error: 'Resolution message is required' });
        return;
      }

      // ✅ SEGURIDAD: Verificar propiedad del ticket
      const hasAccess = await this.verifyTicketOwnership(
        ticketId,
        req.user!.id,
        req.user!.role,
        res
      );
      
      if (!hasAccess) {
        return;
      }

      const ticket = await this.resolveTicket.execute(
        ticketId, resolution_message, agent_id, agent_name
      );
      
      if (!ticket) {
        res.status(404).json({ error: 'Ticket not found' });
        return;
      }

      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      logger.error('Error resolving ticket:', error);
      res.status(500).json({
        error: 'Failed to resolve ticket'
      });
    }
  };

  closeTicketHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const ticketId = parseInt(req.params.id);
      const { close_message, agent_id, agent_name } = req.body;
      
      if (isNaN(ticketId)) {
        res.status(400).json({ error: 'Invalid ticket ID' });
        return;
      }

      // ✅ SEGURIDAD: Verificar propiedad del ticket
      const hasAccess = await this.verifyTicketOwnership(
        ticketId,
        req.user!.id,
        req.user!.role,
        res
      );
      
      if (!hasAccess) {
        return;
      }

      const ticket = await this.closeTicket.execute(
        ticketId, close_message, agent_id, agent_name
      );
      
      if (!ticket) {
        res.status(404).json({ error: 'Ticket not found' });
        return;
      }

      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      logger.error('Error closing ticket:', error);
      res.status(500).json({
        error: 'Failed to close ticket'
      });
    }
  };

  createSatisfactionSurveyHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const ticketId = parseInt(req.params.id);
      const surveyData: CreateSatisfactionSurveyRequest = req.body;
      
      if (isNaN(ticketId)) {
        res.status(400).json({ error: 'Invalid ticket ID' });
        return;
      }

      // ✅ SEGURIDAD: Verificar propiedad del ticket
      const hasAccess = await this.verifyTicketOwnership(
        ticketId,
        req.user!.id,
        req.user!.role,
        res
      );
      
      if (!hasAccess) {
        return;
      }

      const survey = await this.createSatisfactionSurvey.execute(ticketId, surveyData);
      
      res.status(201).json({
        success: true,
        data: survey
      });
    } catch (error) {
      logger.error('Error creating satisfaction survey:', error);
      res.status(500).json({
        error: 'Failed to create satisfaction survey'
      });
    }
  };

  sendSatisfactionSurveyHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const ticketId = parseInt(req.params.id);
      
      if (isNaN(ticketId)) {
        res.status(400).json({ error: 'Invalid ticket ID' });
        return;
      }

      const result = await this.sendSatisfactionSurvey.execute(ticketId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error sending satisfaction survey:', error);
      res.status(500).json({
        error: 'Failed to send satisfaction survey'
      });
    }
  };

  getSatisfactionMetricsHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;
      const includeTicketMetrics = req.query.include_ticket_metrics === 'true';

      const metrics = await this.getSatisfactionMetrics.execute(startDate, endDate, includeTicketMetrics);
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Error getting satisfaction metrics:', error);
      res.status(500).json({
        error: 'Failed to get satisfaction metrics'
      });
    }
  };

  getResponseTimeMetricsHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;
      const category = req.query.category as TicketCategory;
      const priority = req.query.priority as TicketPriority;

      const metrics = await this.getResponseTimeMetrics.execute(startDate, endDate, category, priority);
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Error getting response time metrics:', error);
      res.status(500).json({
        error: 'Failed to get response time metrics'
      });
    }
  };

  getTicketsApproachingSLABreachHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const tickets = await this.getTicketsApproachingSLABreach.execute();
      
      res.json({
        success: true,
        data: tickets
      });
    } catch (error) {
      logger.error('Error getting tickets approaching SLA breach:', error);
      res.status(500).json({
        error: 'Failed to get tickets approaching SLA breach'
      });
    }
  };

  getTicketAuditSummaryHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const ticketId = parseInt(req.params.id);
      
      if (isNaN(ticketId)) {
        res.status(400).json({ error: 'Invalid ticket ID' });
        return;
      }

      // ✅ SEGURIDAD: Verificar propiedad del ticket
      const hasAccess = await this.verifyTicketOwnership(
        ticketId,
        req.user!.id,
        req.user!.role,
        res
      );
      
      if (!hasAccess) {
        return;
      }

      const auditSummary = await this.getTicketAuditSummary.execute(ticketId);
      
      res.json({
        success: true,
        data: auditSummary
      });
    } catch (error) {
      logger.error('Error getting audit summary:', error);
      res.status(500).json({
        error: 'Failed to get audit summary'
      });
    }
  };

  updateSLABenchmarkHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { 
        category, 
        priority, 
        target_first_response_minutes, 
        target_resolution_hours, 
        escalation_threshold_hours 
      } = req.body;

      if (!category || !priority || 
          target_first_response_minutes === undefined || 
          target_resolution_hours === undefined || 
          escalation_threshold_hours === undefined) {
        res.status(400).json({
          error: 'Missing required fields: category, priority, target_first_response_minutes, target_resolution_hours, escalation_threshold_hours'
        });
        return;
      }

      const benchmark = await this.updateSLABenchmark.execute(
        category,
        priority,
        target_first_response_minutes,
        target_resolution_hours,
        escalation_threshold_hours
      );
      
      res.json({
        success: true,
        data: benchmark
      });
    } catch (error) {
      logger.error('Error updating SLA benchmark:', error);
      res.status(500).json({
        error: 'Failed to update SLA benchmark'
      });
    }
  };

  getMetricsHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;

      const metrics = await this.getTicketMetrics.execute(startDate, endDate);
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Error getting metrics:', error);
      res.status(500).json({
        error: 'Failed to get metrics'
      });
    }
  };

  getDetailedMetricsHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;

      const metrics = await this.getDetailedMetrics.execute(startDate, endDate);
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Error getting detailed metrics:', error);
      res.status(500).json({
        error: 'Failed to get detailed metrics'
      });
    }
  };

  escalateFromChatbotHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const {
        chat_session_id,
        customer_email,
        customer_name,
        subject,
        description,
        escalation_reason,
        user_id,
        order_id
      } = req.body;

      if (!chat_session_id || !customer_email || !customer_name || 
          !subject || !description || !escalation_reason) {
        res.status(400).json({
          error: 'Missing required fields for escalation'
        });
        return;
      }

      const result = await this.escalateToHuman.execute(
        {
          sessionId: chat_session_id,
          userId: user_id,
          customerEmail: customer_email,
          customerName: customer_name,
          conversationHistory: req.body.conversation_history || [],
          detectedIntent: req.body.detected_intent,
          confidence: req.body.confidence,
          orderId: order_id
        },
        escalation_reason,
        description
      );

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error escalating from chatbot:', error);
      res.status(500).json({
        error: 'Failed to escalate to human support'
      });
    }
  };

  getTicketAuditTrailHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const ticketId = parseInt(req.params.id);
      
      if (isNaN(ticketId)) {
        res.status(400).json({ error: 'Invalid ticket ID' });
        return;
      }

      // ✅ SEGURIDAD: Verificar propiedad del ticket
      const hasAccess = await this.verifyTicketOwnership(
        ticketId,
        req.user!.id,
        req.user!.role,
        res
      );
      
      if (!hasAccess) {
        return;
      }

      const auditTrail = await this.getTicketAuditTrail.execute(ticketId);
      
      res.json({
        success: true,
        data: auditTrail
      });
    } catch (error) {
      logger.error('Error getting audit trail:', error);
      res.status(500).json({
        error: 'Failed to get audit trail'
      });
    }
  };

  getSLABenchmarksHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const benchmarks = await this.getSLABenchmarks.execute();
      
      res.json({
        success: true,
        data: benchmarks
      });
    } catch (error) {
      logger.error('Error getting SLA benchmarks:', error);
      res.status(500).json({
        error: 'Failed to get SLA benchmarks'
      });
    }
  };
}
