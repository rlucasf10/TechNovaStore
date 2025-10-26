import { Request, Response } from 'express';
import { TicketService } from '../services/TicketService';
import { EscalationService } from '../services/EscalationService';
import { SatisfactionService } from '../services/SatisfactionService';
import {
  CreateTicketRequest,
  UpdateTicketRequest,
  AddMessageRequest,
  CreateSatisfactionSurveyRequest,
  TicketStatus,
  TicketCategory,
  TicketPriority
} from '../types';

export class TicketController {
  constructor(
    private ticketService: TicketService,
    private escalationService: EscalationService,
    private satisfactionService: SatisfactionService
  ) {}

  /**
   * Create a new ticket
   */
  createTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const ticketData: CreateTicketRequest = req.body;
      
      // Validate required fields
      if (!ticketData.customer_email || !ticketData.customer_name || 
          !ticketData.subject || !ticketData.description) {
        res.status(400).json({
          error: 'Missing required fields: customer_email, customer_name, subject, description'
        });
        return;
      }

      const ticket = await this.ticketService.createTicket(ticketData);
      
      res.status(201).json({
        success: true,
        data: ticket
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      res.status(500).json({
        error: 'Failed to create ticket'
      });
    }
  };

  /**
   * Get ticket by ID
   */
  getTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const ticketId = parseInt(req.params.id);
      
      if (isNaN(ticketId)) {
        res.status(400).json({ error: 'Invalid ticket ID' });
        return;
      }

      const ticket = await this.ticketService.getTicketById(ticketId);
      
      if (!ticket) {
        res.status(404).json({ error: 'Ticket not found' });
        return;
      }

      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      console.error('Error getting ticket:', error);
      res.status(500).json({
        error: 'Failed to get ticket'
      });
    }
  };

  /**
   * Get ticket by number
   */
  getTicketByNumber = async (req: Request, res: Response): Promise<void> => {
    try {
      const ticketNumber = req.params.number;
      
      const ticket = await this.ticketService.getTicketByNumber(ticketNumber);
      
      if (!ticket) {
        res.status(404).json({ error: 'Ticket not found' });
        return;
      }

      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      console.error('Error getting ticket by number:', error);
      res.status(500).json({
        error: 'Failed to get ticket'
      });
    }
  };

  /**
   * Update ticket
   */
  updateTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const ticketId = parseInt(req.params.id);
      const updateData: UpdateTicketRequest = req.body;
      
      if (isNaN(ticketId)) {
        res.status(400).json({ error: 'Invalid ticket ID' });
        return;
      }

      const ticket = await this.ticketService.updateTicket(ticketId, updateData);
      
      if (!ticket) {
        res.status(404).json({ error: 'Ticket not found' });
        return;
      }

      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      console.error('Error updating ticket:', error);
      res.status(500).json({
        error: 'Failed to update ticket'
      });
    }
  };

  /**
   * Get tickets with filtering and pagination
   */
  getTickets = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as TicketStatus;
      const category = req.query.category as TicketCategory;
      const priority = req.query.priority as TicketPriority;
      const assignedTo = req.query.assigned_to ? parseInt(req.query.assigned_to as string) : undefined;

      const result = await this.ticketService.getTickets(
        page, limit, status, category, priority, assignedTo
      );

      res.json({
        success: true,
        data: result.tickets,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: result.pages
        }
      });
    } catch (error) {
      console.error('Error getting tickets:', error);
      res.status(500).json({
        error: 'Failed to get tickets'
      });
    }
  };

  /**
   * Add message to ticket
   */
  addMessage = async (req: Request, res: Response): Promise<void> => {
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

      const message = await this.ticketService.addMessage(ticketId, messageData);
      
      res.status(201).json({
        success: true,
        data: message
      });
    } catch (error) {
      console.error('Error adding message:', error);
      res.status(500).json({
        error: 'Failed to add message'
      });
    }
  };

  /**
   * Get ticket messages
   */
  getMessages = async (req: Request, res: Response): Promise<void> => {
    try {
      const ticketId = parseInt(req.params.id);
      const includeInternal = req.query.include_internal === 'true';
      
      if (isNaN(ticketId)) {
        res.status(400).json({ error: 'Invalid ticket ID' });
        return;
      }

      const messages = await this.ticketService.getTicketMessages(ticketId, includeInternal);
      
      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({
        error: 'Failed to get messages'
      });
    }
  };

  /**
   * Resolve ticket
   */
  resolveTicket = async (req: Request, res: Response): Promise<void> => {
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

      const ticket = await this.ticketService.resolveTicket(
        ticketId, resolution_message, agent_id, agent_name
      );
      
      if (!ticket) {
        res.status(404).json({ error: 'Ticket not found' });
        return;
      }

      // Send satisfaction survey
      try {
        await this.satisfactionService.sendSatisfactionSurvey(ticketId);
      } catch (surveyError) {
        console.error('Error sending satisfaction survey:', surveyError);
        // Don't fail the resolution if survey sending fails
      }

      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      console.error('Error resolving ticket:', error);
      res.status(500).json({
        error: 'Failed to resolve ticket'
      });
    }
  };

  /**
   * Close ticket
   */
  closeTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const ticketId = parseInt(req.params.id);
      const { close_message, agent_id, agent_name } = req.body;
      
      if (isNaN(ticketId)) {
        res.status(400).json({ error: 'Invalid ticket ID' });
        return;
      }

      const ticket = await this.ticketService.closeTicket(
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
      console.error('Error closing ticket:', error);
      res.status(500).json({
        error: 'Failed to close ticket'
      });
    }
  };

  /**
   * Create satisfaction survey
   */
  createSatisfactionSurvey = async (req: Request, res: Response): Promise<void> => {
    try {
      const ticketId = parseInt(req.params.id);
      const surveyData: CreateSatisfactionSurveyRequest = req.body;
      
      if (isNaN(ticketId)) {
        res.status(400).json({ error: 'Invalid ticket ID' });
        return;
      }

      const survey = await this.satisfactionService.createSatisfactionSurvey(ticketId, surveyData);
      
      res.status(201).json({
        success: true,
        data: survey
      });
    } catch (error) {
      console.error('Error creating satisfaction survey:', error);
      res.status(500).json({
        error: 'Failed to create satisfaction survey'
      });
    }
  };

  /**
   * Get ticket metrics
   */
  getMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;

      const metrics = await this.ticketService.getTicketMetrics(startDate, endDate);
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Error getting metrics:', error);
      res.status(500).json({
        error: 'Failed to get metrics'
      });
    }
  };

  /**
   * Get detailed metrics with response times and SLA compliance
   */
  getDetailedMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;

      const metrics = await this.ticketService.getDetailedMetrics(startDate, endDate);
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Error getting detailed metrics:', error);
      res.status(500).json({
        error: 'Failed to get detailed metrics'
      });
    }
  };

  /**
   * Get response time metrics
   */
  getResponseTimeMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;
      const category = req.query.category as TicketCategory;
      const priority = req.query.priority as TicketPriority;

      const metrics = await this.ticketService.getResponseTimeMetrics(startDate, endDate, category, priority);
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Error getting response time metrics:', error);
      res.status(500).json({
        error: 'Failed to get response time metrics'
      });
    }
  };

  /**
   * Get tickets approaching SLA breach
   */
  getTicketsApproachingSLABreach = async (req: Request, res: Response): Promise<void> => {
    try {
      const tickets = await this.ticketService.getTicketsApproachingSLABreach();
      
      res.json({
        success: true,
        data: tickets
      });
    } catch (error) {
      console.error('Error getting tickets approaching SLA breach:', error);
      res.status(500).json({
        error: 'Failed to get tickets approaching SLA breach'
      });
    }
  };

  /**
   * Get audit trail for a ticket
   */
  getTicketAuditTrail = async (req: Request, res: Response): Promise<void> => {
    try {
      const ticketId = parseInt(req.params.id);
      
      if (isNaN(ticketId)) {
        res.status(400).json({ error: 'Invalid ticket ID' });
        return;
      }

      const auditTrail = await this.ticketService.getTicketAuditTrail(ticketId);
      
      res.json({
        success: true,
        data: auditTrail
      });
    } catch (error) {
      console.error('Error getting audit trail:', error);
      res.status(500).json({
        error: 'Failed to get audit trail'
      });
    }
  };

  /**
   * Get audit summary for a ticket
   */
  getTicketAuditSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const ticketId = parseInt(req.params.id);
      
      if (isNaN(ticketId)) {
        res.status(400).json({ error: 'Invalid ticket ID' });
        return;
      }

      const auditSummary = await this.ticketService.getTicketAuditSummary(ticketId);
      
      res.json({
        success: true,
        data: auditSummary
      });
    } catch (error) {
      console.error('Error getting audit summary:', error);
      res.status(500).json({
        error: 'Failed to get audit summary'
      });
    }
  };

  /**
   * Get SLA benchmarks
   */
  getSLABenchmarks = async (req: Request, res: Response): Promise<void> => {
    try {
      const benchmarks = await this.ticketService.getSLABenchmarks();
      
      res.json({
        success: true,
        data: benchmarks
      });
    } catch (error) {
      console.error('Error getting SLA benchmarks:', error);
      res.status(500).json({
        error: 'Failed to get SLA benchmarks'
      });
    }
  };

  /**
   * Update SLA benchmark
   */
  updateSLABenchmark = async (req: Request, res: Response): Promise<void> => {
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

      const benchmark = await this.ticketService.updateSLABenchmark(
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
      console.error('Error updating SLA benchmark:', error);
      res.status(500).json({
        error: 'Failed to update SLA benchmark'
      });
    }
  };

  /**
   * Get satisfaction metrics
   */
  getSatisfactionMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;
      const includeTicketMetrics = req.query.include_ticket_metrics === 'true';

      const metrics = await this.satisfactionService.getSatisfactionMetrics(
        startDate, endDate, includeTicketMetrics
      );
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Error getting satisfaction metrics:', error);
      res.status(500).json({
        error: 'Failed to get satisfaction metrics'
      });
    }
  };

  /**
   * Escalate from chatbot
   */
  escalateFromChatbot = async (req: Request, res: Response): Promise<void> => {
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

      const result = await this.escalationService.escalateToHuman(
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
      console.error('Error escalating from chatbot:', error);
      res.status(500).json({
        error: 'Failed to escalate to human support'
      });
    }
  };
}