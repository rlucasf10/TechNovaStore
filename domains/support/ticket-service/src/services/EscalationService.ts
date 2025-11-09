import { TicketService } from './TicketService';
import { EscalationReason, TicketCategory } from '../types';

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

export interface EscalationDecision {
  shouldEscalate: boolean;
  reason?: EscalationReason;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  suggestedCategory?: TicketCategory;
  escalationMessage?: string;
}

export class EscalationService {
  private ticketService: TicketService;

  constructor(ticketService: TicketService) {
    this.ticketService = ticketService;
  }

  /**
   * Analyze conversation and decide if escalation is needed
   */
  analyzeForEscalation(context: EscalationContext): EscalationDecision {
    const decision: EscalationDecision = {
      shouldEscalate: false
    };

    // Check for explicit escalation requests
    const explicitEscalation = this.checkExplicitEscalationRequest(context);
    if (explicitEscalation.shouldEscalate) {
      return explicitEscalation;
    }

    // Check for low confidence responses
    const confidenceEscalation = this.checkLowConfidence(context);
    if (confidenceEscalation.shouldEscalate) {
      return confidenceEscalation;
    }

    // Check for repetitive unresolved queries
    const repetitiveEscalation = this.checkRepetitiveQueries(context);
    if (repetitiveEscalation.shouldEscalate) {
      return repetitiveEscalation;
    }

    // Check for complex technical queries
    const complexityEscalation = this.checkComplexity(context);
    if (complexityEscalation.shouldEscalate) {
      return complexityEscalation;
    }

    // Check for complaint indicators
    const complaintEscalation = this.checkComplaintIndicators(context);
    if (complaintEscalation.shouldEscalate) {
      return complaintEscalation;
    }

    return decision;
  }

  /**
   * Execute escalation to human support
   */
  async escalateToHuman(
    context: EscalationContext,
    reason: EscalationReason,
    customMessage?: string
  ): Promise<{ ticketId: number; ticketNumber: string }> {
    const subject = this.generateEscalationSubject(context, reason);
    const description = customMessage || this.generateEscalationDescription(context, reason);

    const ticket = await this.ticketService.createTicketFromChatbot(
      context.sessionId,
      context.customerEmail,
      context.customerName,
      subject,
      description,
      reason,
      context.userId,
      context.orderId
    );

    // Add conversation history as context
    if (context.conversationHistory.length > 0) {
      const historyMessage = this.formatConversationHistory(context.conversationHistory);
      await this.ticketService.addMessage(ticket.id, {
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

  /**
   * Check for explicit escalation requests
   */
  private checkExplicitEscalationRequest(context: EscalationContext): EscalationDecision {
    const recentMessages = context.conversationHistory.slice(-3);
    const userMessages = recentMessages
      .filter(msg => msg.sender === 'user')
      .map(msg => msg.message.toLowerCase());

    const escalationKeywords = [
      'hablar con una persona',
      'agente humano',
      'soporte técnico',
      'no me ayudas',
      'quiero hablar con alguien',
      'atención al cliente',
      'representante',
      'supervisor',
      'gerente'
    ];

    for (const message of userMessages) {
      for (const keyword of escalationKeywords) {
        if (message.includes(keyword)) {
          return {
            shouldEscalate: true,
            reason: EscalationReason.CUSTOMER_REQUEST,
            priority: 'medium',
            escalationMessage: 'El cliente ha solicitado específicamente hablar con un agente humano.'
          };
        }
      }
    }

    return { shouldEscalate: false };
  }

  /**
   * Check for low confidence in bot responses
   */
  private checkLowConfidence(context: EscalationContext): EscalationDecision {
    if (context.confidence !== undefined && context.confidence < 0.3) {
      return {
        shouldEscalate: true,
        reason: EscalationReason.CHATBOT_LIMITATION,
        priority: 'low',
        escalationMessage: 'El chatbot no pudo entender la consulta del cliente con suficiente confianza.'
      };
    }

    return { shouldEscalate: false };
  }

  /**
   * Check for repetitive unresolved queries
   */
  private checkRepetitiveQueries(context: EscalationContext): EscalationDecision {
    if (context.conversationHistory.length < 6) {
      return { shouldEscalate: false };
    }

    const userMessages = context.conversationHistory
      .filter(msg => msg.sender === 'user')
      .map(msg => msg.message.toLowerCase());

    // Check for similar questions being asked multiple times
    const similarityThreshold = 0.7;
    let repetitiveCount = 0;

    for (let i = 0; i < userMessages.length - 1; i++) {
      for (let j = i + 1; j < userMessages.length; j++) {
        if (this.calculateSimilarity(userMessages[i], userMessages[j]) > similarityThreshold) {
          repetitiveCount++;
        }
      }
    }

    if (repetitiveCount >= 2) {
      return {
        shouldEscalate: true,
        reason: EscalationReason.UNRESOLVED_ISSUE,
        priority: 'medium',
        escalationMessage: 'El cliente ha repetido consultas similares sin obtener una resolución satisfactoria.'
      };
    }

    return { shouldEscalate: false };
  }

  /**
   * Check for complex technical queries
   */
  private checkComplexity(context: EscalationContext): EscalationDecision {
    const recentMessages = context.conversationHistory.slice(-2);
    const userMessages = recentMessages
      .filter(msg => msg.sender === 'user')
      .map(msg => msg.message.toLowerCase());

    const complexKeywords = [
      'compatibilidad específica',
      'configuración avanzada',
      'problema técnico complejo',
      'integración',
      'personalización',
      'desarrollo',
      'api',
      'código de error específico'
    ];

    const technicalTerms = [
      'driver',
      'firmware',
      'bios',
      'overclock',
      'benchmark',
      'latencia',
      'throughput',
      'arquitectura'
    ];

    for (const message of userMessages) {
      const hasComplexKeywords = complexKeywords.some(keyword => message.includes(keyword));
      const hasTechnicalTerms = technicalTerms.filter(term => message.includes(term)).length >= 2;

      if (hasComplexKeywords || hasTechnicalTerms) {
        return {
          shouldEscalate: true,
          reason: EscalationReason.COMPLEX_QUERY,
          priority: 'high',
          suggestedCategory: TicketCategory.TECHNICAL_SUPPORT,
          escalationMessage: 'La consulta requiere conocimiento técnico especializado.'
        };
      }
    }

    return { shouldEscalate: false };
  }

  /**
   * Check for complaint indicators
   */
  private checkComplaintIndicators(context: EscalationContext): EscalationDecision {
    const recentMessages = context.conversationHistory.slice(-3);
    const userMessages = recentMessages
      .filter(msg => msg.sender === 'user')
      .map(msg => msg.message.toLowerCase());

    const complaintKeywords = [
      'estoy molesto',
      'muy insatisfecho',
      'pésimo servicio',
      'quiero quejarme',
      'esto es inaceptable',
      'voy a dejar una mala reseña',
      'quiero mi dinero de vuelta',
      'esto es una estafa',
      'nunca más compro aquí'
    ];

    const emotionalIndicators = [
      'furioso',
      'enojado',
      'indignado',
      'decepcionado',
      'frustrado'
    ];

    for (const message of userMessages) {
      const hasComplaintKeywords = complaintKeywords.some(keyword => message.includes(keyword));
      const hasEmotionalIndicators = emotionalIndicators.some(indicator => message.includes(indicator));

      if (hasComplaintKeywords || hasEmotionalIndicators) {
        return {
          shouldEscalate: true,
          reason: EscalationReason.COMPLAINT_ESCALATION,
          priority: 'urgent',
          suggestedCategory: TicketCategory.COMPLAINT,
          escalationMessage: 'El cliente muestra signos de insatisfacción que requieren atención inmediata.'
        };
      }
    }

    return { shouldEscalate: false };
  }

  /**
   * Generate escalation subject based on context
   */
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

  /**
   * Generate escalation description
   */
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

  /**
   * Format conversation history for ticket
   */
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

  /**
   * Calculate similarity between two strings (simple implementation)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  /**
   * Get escalation reason text
   */
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