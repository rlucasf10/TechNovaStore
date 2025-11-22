/**
 * Caso de uso: Crear un nuevo ticket
 * Extraído del método createTicket() de TicketService
 * TODA LA LÓGICA ORIGINAL PRESERVADA
 */

import { TicketRepository } from '../shared/repositories/TicketRepository';
import { ITicket, CreateTicketRequest, TicketCategory, TicketPriority, EscalationReason } from '../shared/types';

export class CreateTicket {
  constructor(private ticketRepository: TicketRepository) {}

  async execute(ticketData: CreateTicketRequest): Promise<ITicket> {
    // Auto-categorize based on keywords if not provided (LÓGICA ORIGINAL)
    if (!ticketData.category) {
      ticketData.category = this.categorizeTicket(ticketData.subject, ticketData.description);
    }

    // Auto-prioritize based on category and keywords (LÓGICA ORIGINAL)
    if (!ticketData.priority) {
      ticketData.priority = this.prioritizeTicket(ticketData.category, ticketData.subject, ticketData.description);
    }

    const ticket = await this.ticketRepository.createTicket(ticketData);

    // Add initial system message (LÓGICA ORIGINAL)
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
   * Auto-categorize ticket based on content (LÓGICA ORIGINAL)
   */
  private categorizeTicket(subject: string, description: string): TicketCategory {
    const content = `${subject} ${description}`.toLowerCase();

    // Payment-related keywords (check first as they're more specific)
    if (content.match(/pago|factura|cobro|tarjeta|paypal|transferencia/)) {
      return TicketCategory.PAYMENT_PROBLEM;
    }

    // Order-related keywords
    if (content.match(/pedido|orden|compra|envío|entrega|tracking|seguimiento/)) {
      if (content.match(/envío|entrega|tracking|seguimiento/)) {
        return TicketCategory.SHIPPING_INQUIRY;
      }
      return TicketCategory.ORDER_ISSUE;
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
   * Auto-prioritize ticket based on category and content (LÓGICA ORIGINAL)
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
   * Get escalation reason text (LÓGICA ORIGINAL)
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
}
