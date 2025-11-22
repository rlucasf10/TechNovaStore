/**
 * Caso de uso: Escalar desde chatbot a soporte humano
 * Extraído del método escalateToHuman() de EscalationService
 */

import { CreateTicketFromChatbot } from '../create-ticket-from-chatbot/CreateTicketFromChatbot';
import { TicketRepository } from '../shared/repositories/TicketRepository';
import { EscalationReason, TicketCategory } from '../shared/types';

export interface EscalationContext {
  sessionId: string;
  userId?: number;
  customerEmail: string;
  customerName: string;
  conversationHistory: Array<{
    message: string;
    timestamp: Date;
    sender: 'user' | 'bot';
  }>;
  detectedIntent?: string;
  confidence?: number;
  orderId?: number;
}

export class EscalateToHuman {
  constructor(
    private createTicketFromChatbot: CreateTicketFromChatbot,
    private ticketRepository: TicketRepository
  ) {}

  async execute(
    context: EscalationContext,
    reason: EscalationReason,
    customMessage?: string
  ): Promise<{ ticketId: number; ticketNumber: string }> {
    const subject = this.generateEscalationSubject(context, reason);
    const description = customMessage || this.generateEscalationDescription(context, reason);

    const ticket = await this.createTicketFromChatbot.execute(
      context.sessionId,
      context.customerEmail,
      context.customerName,
      subject,
      description,
      reason,
      context.userId,
      context.orderId
    );

    // Add conversation history as context (LÓGICA ORIGINAL)
    if (context.conversationHistory.length > 0) {
      const historyMessage = this.formatConversationHistory(context.conversationHistory);
      await this.ticketRepository.addMessage(ticket.id, {
        sender_type: 'system',
        sender_name: 'Sistema de Escalación',
        message: `Historial de conversación del chatbot:\n\n${historyMessage}`,
        is_internal: true
      });
    }

    return {
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number
    };
  }

  private generateEscalationSubject(context: EscalationContext, reason: EscalationReason): string {
    const baseSubject = context.detectedIntent ? 
      `Consulta sobre ${context.detectedIntent}` : 
      'Consulta de cliente';

    switch (reason) {
      case EscalationReason.CUSTOMER_REQUEST:
        return `${baseSubject} - Solicitud de agente humano`;
      case EscalationReason.COMPLEX_QUERY:
        return `${baseSubject} - Consulta técnica compleja`;
      case EscalationReason.COMPLAINT_ESCALATION:
        return `${baseSubject} - Queja de cliente`;
      case EscalationReason.UNRESOLVED_ISSUE:
        return `${baseSubject} - Problema no resuelto`;
      default:
        return `${baseSubject} - Escalación desde chatbot`;
    }
  }

  private generateEscalationDescription(context: EscalationContext, reason: EscalationReason): string {
    const lastUserMessage = context.conversationHistory
      .filter(msg => msg.sender === 'user')
      .slice(-1)[0]?.message || 'No hay mensaje reciente';

    let description = `Escalación automática desde el chatbot.\n\n`;
    description += `Razón de escalación: ${this.getEscalationReasonText(reason)}\n\n`;
    description += `Último mensaje del cliente: "${lastUserMessage}"\n\n`;
    
    if (context.detectedIntent) {
      description += `Intención detectada: ${context.detectedIntent}\n`;
    }
    
    if (context.confidence !== undefined) {
      description += `Nivel de confianza: ${(context.confidence * 100).toFixed(1)}%\n`;
    }

    if (context.orderId) {
      description += `ID de pedido relacionado: ${context.orderId}\n`;
    }

    description += `\nSesión de chat: ${context.sessionId}`;

    return description;
  }

  private formatConversationHistory(history: EscalationContext['conversationHistory']): string {
    return history
      .slice(-10) // Last 10 messages
      .map(msg => {
        const timestamp = msg.timestamp.toLocaleString('es-ES');
        const sender = msg.sender === 'user' ? 'Cliente' : 'Chatbot';
        return `[${timestamp}] ${sender}: ${msg.message}`;
      })
      .join('\n');
  }

  private getEscalationReasonText(reason: EscalationReason): string {
    switch (reason) {
      case EscalationReason.COMPLEX_QUERY:
        return 'Consulta compleja que requiere conocimiento especializado';
      case EscalationReason.CUSTOMER_REQUEST:
        return 'Solicitud específica del cliente para hablar con un agente';
      case EscalationReason.CHATBOT_LIMITATION:
        return 'Limitación del chatbot para entender o resolver la consulta';
      case EscalationReason.UNRESOLVED_ISSUE:
        return 'Problema que no pudo ser resuelto por el chatbot';
      case EscalationReason.COMPLAINT_ESCALATION:
        return 'Escalación de queja o expresión de insatisfacción';
      default:
        return 'Razón de escalación no especificada';
    }
  }
}
