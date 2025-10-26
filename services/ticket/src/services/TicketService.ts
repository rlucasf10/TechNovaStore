import { Pool } from 'pg';
import { TicketRepository } from '../database/TicketRepository';
import { AuditService, AuditActionType } from './AuditService';
import { MetricsService } from './MetricsService';
import {
  ITicket,
  ITicketMessage,
  ISatisfactionSurvey,
  ITicketMetrics,
  CreateTicketRequest,
  UpdateTicketRequest,
  AddMessageRequest,
  CreateSatisfactionSurveyRequest,
  TicketStatus,
  TicketCategory,
  TicketPriority,
  EscalationReason
} from '../types';

export class TicketService {
  private ticketRepository: TicketRepository;
  private auditService: AuditService;
  private metricsService: MetricsService;

  constructor(pool: Pool) {
    this.ticketRepository = new TicketRepository(pool);
    this.auditService = new AuditService(pool);
    this.metricsService = new MetricsService(pool);
  }

  /**
   * Create a new ticket
   */
  async createTicket(ticketData: CreateTicketRequest): Promise<ITicket> {
    // Auto-categorize based on keywords if not provided
    if (!ticketData.category) {
      ticketData.category = this.categorizeTicket(ticketData.subject, ticketData.description);
    }

    // Auto-prioritize based on category and keywords
    if (!ticketData.priority) {
      ticketData.priority = this.prioritizeTicket(ticketData.category, ticketData.subject, ticketData.description);
    }

    const ticket = await this.ticketRepository.createTicket(ticketData);

    // Add initial system message
    await this.ticketRepository.addMessage(ticket.id, {
      sender_type: 'system',
      sender_name: 'Sistema TechNovaStore',
      message: `Ticket creado automáticamente. ${ticketData.escalated_from_chatbot ? 
        `Escalado desde chatbot por: ${this.getEscalationReasonText(ticketData.escalation_reason)}` : 
        'Creado directamente por el cliente.'}`
    });

    return ticket;
  }

  /**
   * Create ticket from chatbot escalation
   */
  async createTicketFromChatbot(
    chatSessionId: string,
    customerEmail: string,
    customerName: string,
    subject: string,
    description: string,
    escalationReason: EscalationReason,
    userId?: number,
    orderId?: number
  ): Promise<ITicket> {
    const ticketData: CreateTicketRequest = {
      user_id: userId,
      customer_email: customerEmail,
      customer_name: customerName,
      subject,
      description,
      category: this.categorizeTicket(subject, description),
      escalated_from_chatbot: true,
      escalation_reason: escalationReason,
      chat_session_id: chatSessionId,
      order_id: orderId
    };

    return this.createTicket(ticketData);
  }

  /**
   * Get ticket by ID
   */
  async getTicketById(ticketId: number): Promise<ITicket | null> {
    return this.ticketRepository.getTicketById(ticketId);
  }

  /**
   * Get ticket by number
   */
  async getTicketByNumber(ticketNumber: string): Promise<ITicket | null> {
    return this.ticketRepository.getTicketByNumber(ticketNumber);
  }

  /**
   * Update ticket
   */
  async updateTicket(ticketId: number, updateData: UpdateTicketRequest): Promise<ITicket | null> {
    const ticket = await this.ticketRepository.updateTicket(ticketId, updateData);
    
    if (ticket && updateData.status) {
      // Add system message for status changes
      const statusMessage = this.getStatusChangeMessage(updateData.status);
      await this.ticketRepository.addMessage(ticketId, {
        sender_type: 'system',
        sender_name: 'Sistema TechNovaStore',
        message: statusMessage
      });
    }

    return ticket;
  }

  /**
   * Get tickets with filtering and pagination
   */
  async getTickets(
    page: number = 1,
    limit: number = 20,
    status?: TicketStatus,
    category?: TicketCategory,
    priority?: TicketPriority,
    assignedTo?: number
  ): Promise<{ tickets: ITicket[]; total: number; pages: number }> {
    const result = await this.ticketRepository.getTickets(page, limit, status, category, priority, assignedTo);
    
    return {
      ...result,
      pages: Math.ceil(result.total / limit)
    };
  }

  /**
   * Add message to ticket
   */
  async addMessage(ticketId: number, messageData: AddMessageRequest): Promise<ITicketMessage> {
    const message = await this.ticketRepository.addMessage(ticketId, messageData);

    // Log audit entry for message
    await this.auditService.logAuditEntry(
      ticketId,
      AuditActionType.MESSAGE_ADDED,
      messageData.sender_type,
      messageData.sender_name,
      messageData.sender_id,
      undefined,
      `Message added: ${messageData.message.substring(0, 100)}${messageData.message.length > 100 ? '...' : ''}`,
      { is_internal: messageData.is_internal }
    );

    // Track first response time for agent messages
    if (messageData.sender_type === 'agent') {
      const ticket = await this.ticketRepository.getTicketById(ticketId);
      if (ticket && !ticket.first_response_at) {
        await this.ticketRepository.updateTicket(ticketId, {
          first_response_at: new Date()
        });
      }
    }

    // Auto-update ticket status if customer responds
    if (messageData.sender_type === 'customer') {
      const ticket = await this.ticketRepository.getTicketById(ticketId);
      if (ticket && ticket.status === TicketStatus.WAITING_CUSTOMER) {
        await this.ticketRepository.updateTicket(ticketId, {
          status: TicketStatus.IN_PROGRESS
        });
      }
    }

    return message;
  }

  /**
   * Get ticket messages
   */
  async getTicketMessages(ticketId: number, includeInternal: boolean = false): Promise<ITicketMessage[]> {
    return this.ticketRepository.getTicketMessages(ticketId, includeInternal);
  }

  /**
   * Resolve ticket
   */
  async resolveTicket(ticketId: number, resolutionMessage: string, agentId?: number, agentName?: string): Promise<ITicket | null> {
    // Add resolution message
    await this.ticketRepository.addMessage(ticketId, {
      sender_type: 'agent',
      sender_id: agentId,
      sender_name: agentName || 'Agente de Soporte',
      message: resolutionMessage
    });

    // Update ticket status
    return this.ticketRepository.updateTicket(ticketId, {
      status: TicketStatus.RESOLVED
    });
  }

  /**
   * Close ticket
   */
  async closeTicket(ticketId: number, closeMessage?: string, agentId?: number, agentName?: string): Promise<ITicket | null> {
    if (closeMessage) {
      await this.ticketRepository.addMessage(ticketId, {
        sender_type: 'agent',
        sender_id: agentId,
        sender_name: agentName || 'Agente de Soporte',
        message: closeMessage
      });
    }

    return this.ticketRepository.updateTicket(ticketId, {
      status: TicketStatus.CLOSED
    });
  }

  /**
   * Create satisfaction survey
   */
  async createSatisfactionSurvey(
    ticketId: number, 
    surveyData: CreateSatisfactionSurveyRequest
  ): Promise<ISatisfactionSurvey> {
    return this.ticketRepository.createSatisfactionSurvey(ticketId, surveyData);
  }

  /**
   * Get ticket metrics
   */
  async getTicketMetrics(startDate?: Date, endDate?: Date): Promise<ITicketMetrics> {
    return this.ticketRepository.getTicketMetrics(startDate, endDate);
  }

  /**
   * Get detailed metrics with response times and SLA compliance
   */
  async getDetailedMetrics(startDate?: Date, endDate?: Date) {
    return this.metricsService.getDetailedTicketMetrics(startDate, endDate);
  }

  /**
   * Get response time metrics
   */
  async getResponseTimeMetrics(
    startDate?: Date,
    endDate?: Date,
    category?: TicketCategory,
    priority?: TicketPriority
  ) {
    return this.metricsService.getResponseTimeMetrics(startDate, endDate, category, priority);
  }

  /**
   * Get tickets approaching SLA breach
   */
  async getTicketsApproachingSLABreach() {
    return this.metricsService.getTicketsApproachingSLABreach();
  }

  /**
   * Get audit trail for a ticket
   */
  async getTicketAuditTrail(ticketId: number) {
    return this.auditService.getTicketAuditTrail(ticketId);
  }

  /**
   * Get audit summary for a ticket
   */
  async getTicketAuditSummary(ticketId: number) {
    return this.auditService.getTicketAuditSummary(ticketId);
  }

  /**
   * Get SLA benchmarks
   */
  async getSLABenchmarks() {
    return this.metricsService.getSLABenchmarks();
  }

  /**
   * Update SLA benchmark
   */
  async updateSLABenchmark(
    category: TicketCategory,
    priority: TicketPriority,
    targetFirstResponseMinutes: number,
    targetResolutionHours: number,
    escalationThresholdHours: number
  ) {
    return this.metricsService.updateSLABenchmark(
      category,
      priority,
      targetFirstResponseMinutes,
      targetResolutionHours,
      escalationThresholdHours
    );
  }

  /**
   * Auto-categorize ticket based on content
   */
  private categorizeTicket(subject: string, description: string): TicketCategory {
    const content = `${subject} ${description}`.toLowerCase();

    // Order-related keywords
    if (content.match(/pedido|orden|compra|envío|entrega|tracking|seguimiento/)) {
      if (content.match(/envío|entrega|tracking|seguimiento/)) {
        return TicketCategory.SHIPPING_INQUIRY;
      }
      return TicketCategory.ORDER_ISSUE;
    }

    // Payment-related keywords
    if (content.match(/pago|factura|cobro|tarjeta|paypal|transferencia/)) {
      return TicketCategory.PAYMENT_PROBLEM;
    }

    // Product-related keywords
    if (content.match(/producto|especificación|característica|compatibilidad|funcionamiento/)) {
      return TicketCategory.PRODUCT_QUESTION;
    }

    // Technical support keywords
    if (content.match(/error|problema|fallo|bug|técnico|no funciona/)) {
      return TicketCategory.TECHNICAL_SUPPORT;
    }

    // Refund keywords
    if (content.match(/devolución|reembolso|cancelar|devolver/)) {
      return TicketCategory.REFUND_REQUEST;
    }

    // Complaint keywords
    if (content.match(/queja|reclamo|insatisfecho|mal servicio|problema grave/)) {
      return TicketCategory.COMPLAINT;
    }

    return TicketCategory.GENERAL_INQUIRY;
  }

  /**
   * Auto-prioritize ticket based on category and content
   */
  private prioritizeTicket(category: TicketCategory, subject: string, description: string): TicketPriority {
    const content = `${subject} ${description}`.toLowerCase();

    // Urgent keywords
    if (content.match(/urgente|inmediato|crítico|grave|emergencia/)) {
      return TicketPriority.URGENT;
    }

    // High priority categories and keywords
    if (category === TicketCategory.COMPLAINT || 
        category === TicketCategory.PAYMENT_PROBLEM ||
        content.match(/no puedo|bloqueado|error crítico/)) {
      return TicketPriority.HIGH;
    }

    // Medium priority categories
    if (category === TicketCategory.ORDER_ISSUE || 
        category === TicketCategory.REFUND_REQUEST ||
        category === TicketCategory.TECHNICAL_SUPPORT) {
      return TicketPriority.MEDIUM;
    }

    return TicketPriority.LOW;
  }

  /**
   * Get escalation reason text
   */
  private getEscalationReasonText(reason?: EscalationReason): string {
    switch (reason) {
      case EscalationReason.COMPLEX_QUERY:
        return 'consulta compleja que requiere atención humana';
      case EscalationReason.CUSTOMER_REQUEST:
        return 'solicitud específica del cliente';
      case EscalationReason.CHATBOT_LIMITATION:
        return 'limitación del chatbot para resolver la consulta';
      case EscalationReason.UNRESOLVED_ISSUE:
        return 'problema no resuelto por el chatbot';
      case EscalationReason.COMPLAINT_ESCALATION:
        return 'escalación de queja o reclamo';
      default:
        return 'razón no especificada';
    }
  }

  /**
   * Get status change message
   */
  private getStatusChangeMessage(status: TicketStatus): string {
    switch (status) {
      case TicketStatus.IN_PROGRESS:
        return 'Ticket asignado y en proceso de resolución.';
      case TicketStatus.WAITING_CUSTOMER:
        return 'Esperando respuesta del cliente.';
      case TicketStatus.RESOLVED:
        return 'Ticket resuelto. Si el problema persiste, puede responder a este ticket.';
      case TicketStatus.CLOSED:
        return 'Ticket cerrado. Gracias por contactarnos.';
      default:
        return `Estado del ticket actualizado a: ${status}`;
    }
  }
}