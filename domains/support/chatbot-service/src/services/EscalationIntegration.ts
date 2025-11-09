import axios from 'axios';
import { ChatContext, ChatResponse } from '../NLPEngine';

export interface EscalationContext {
  sessionId: string;
  userId?: string;
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
  reason?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  escalationMessage?: string;
}

export class EscalationIntegration {
  private ticketServiceUrl: string;
  private conversationHistories: Map<string, Array<{
    message: string;
    timestamp: Date;
    sender: 'user' | 'bot';
  }>>;

  constructor() {
    this.ticketServiceUrl = process.env.TICKET_SERVICE_URL || 'http://localhost:3005';
    this.conversationHistories = new Map();
  }

  /**
   * Record conversation message for potential escalation
   */
  recordConversation(sessionId: string, message: string, sender: 'user' | 'bot'): void {
    if (!this.conversationHistories.has(sessionId)) {
      this.conversationHistories.set(sessionId, []);
    }

    const history = this.conversationHistories.get(sessionId)!;
    history.push({
      message,
      timestamp: new Date(),
      sender
    });

    // Keep only last 20 messages to avoid memory bloat
    if (history.length > 20) {
      history.shift();
    }
  }

  /**
   * Analyze if escalation is needed based on conversation
   */
  analyzeForEscalation(
    sessionId: string,
    userMessage: string,
    botResponse: ChatResponse,
    context: ChatContext
  ): EscalationDecision {
    const decision: EscalationDecision = {
      shouldEscalate: false
    };

    // Check for explicit escalation requests
    const explicitEscalation = this.checkExplicitEscalationRequest(userMessage);
    if (explicitEscalation.shouldEscalate) {
      return explicitEscalation;
    }

    // Check for low confidence responses
    if (botResponse.confidence < 0.3) {
      return {
        shouldEscalate: true,
        reason: 'chatbot_limitation',
        priority: 'low',
        escalationMessage: 'El chatbot no pudo entender la consulta con suficiente confianza.'
      };
    }

    // Check for repetitive unresolved queries
    const repetitiveEscalation = this.checkRepetitiveQueries(sessionId);
    if (repetitiveEscalation.shouldEscalate) {
      return repetitiveEscalation;
    }

    // Check for complaint indicators
    const complaintEscalation = this.checkComplaintIndicators(userMessage);
    if (complaintEscalation.shouldEscalate) {
      return complaintEscalation;
    }

    // Check for complex technical queries
    const complexityEscalation = this.checkComplexity(userMessage);
    if (complexityEscalation.shouldEscalate) {
      return complexityEscalation;
    }

    return decision;
  }

  /**
   * Execute escalation to ticket system
   */
  async escalateToTicketSystem(
    sessionId: string,
    customerEmail: string,
    customerName: string,
    escalationReason: string,
    customMessage?: string,
    userId?: number,
    orderId?: number
  ): Promise<{ ticketId: number; ticketNumber: string }> {
    try {
      const conversationHistory = this.conversationHistories.get(sessionId) || [];
      const lastUserMessage = conversationHistory
        .filter(msg => msg.sender === 'user')
        .slice(-1)[0]?.message || 'Consulta general';

      const subject = this.generateEscalationSubject(lastUserMessage, escalationReason);
      const description = customMessage || this.generateEscalationDescription(
        lastUserMessage, 
        escalationReason, 
        conversationHistory
      );

      const escalationData = {
        chat_session_id: sessionId,
        customer_email: customerEmail,
        customer_name: customerName,
        subject,
        description,
        escalation_reason: escalationReason,
        user_id: userId,
        order_id: orderId,
        conversation_history: conversationHistory.slice(-10), // Last 10 messages
        detected_intent: conversationHistory.length > 0 ? 'chat_escalation' : undefined,
        confidence: 0.9
      };

      const response = await axios.post(
        `${this.ticketServiceUrl}/api/escalate`,
        escalationData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data.success) {
        // Clear conversation history after successful escalation
        this.conversationHistories.delete(sessionId);
        
        return {
          ticketId: response.data.data.ticketId,
          ticketNumber: response.data.data.ticketNumber
        };
      } else {
        throw new Error('Failed to create ticket');
      }
    } catch (error) {
      console.error('Error escalating to ticket system:', error);
      throw new Error('No se pudo crear el ticket de soporte. Por favor, intenta más tarde.');
    }
  }

  /**
   * Generate escalation message for user
   */
  generateEscalationMessage(ticketNumber: string, reason: string): string {
    let message = `He creado un ticket de soporte para ti: **${ticketNumber}**\n\n`;
    
    switch (reason) {
      case 'customer_request':
        message += 'Un agente humano se pondrá en contacto contigo pronto para ayudarte con tu consulta.';
        break;
      case 'complex_query':
        message += 'Tu consulta requiere atención especializada. Un experto técnico revisará tu caso.';
        break;
      case 'complaint_escalation':
        message += 'Hemos escalado tu queja a nuestro equipo de atención al cliente para una resolución prioritaria.';
        break;
      case 'unresolved_issue':
        message += 'Como no he podido resolver tu problema, lo he escalado a nuestro equipo de soporte.';
        break;
      default:
        message += 'Un miembro de nuestro equipo de soporte revisará tu consulta y te contactará pronto.';
    }

    message += '\n\nRecibirás una confirmación por email con los detalles del ticket.';
    message += '\n\n¿Hay algo más en lo que pueda ayudarte mientras tanto?';

    return message;
  }

  /**
   * Check for explicit escalation requests
   */
  private checkExplicitEscalationRequest(userMessage: string): EscalationDecision {
    const message = userMessage.toLowerCase();
    const escalationKeywords = [
      'hablar con una persona',
      'agente humano',
      'soporte técnico',
      'no me ayudas',
      'quiero hablar con alguien',
      'atención al cliente',
      'representante',
      'supervisor',
      'gerente',
      'crear ticket',
      'abrir ticket'
    ];

    for (const keyword of escalationKeywords) {
      if (message.includes(keyword)) {
        return {
          shouldEscalate: true,
          reason: 'customer_request',
          priority: 'medium',
          escalationMessage: 'El cliente ha solicitado específicamente hablar con un agente humano.'
        };
      }
    }

    return { shouldEscalate: false };
  }

  /**
   * Check for repetitive unresolved queries
   */
  private checkRepetitiveQueries(sessionId: string): EscalationDecision {
    const history = this.conversationHistories.get(sessionId) || [];
    
    if (history.length < 6) {
      return { shouldEscalate: false };
    }

    const userMessages = history
      .filter(msg => msg.sender === 'user')
      .map(msg => msg.message.toLowerCase());

    // Simple similarity check for repetitive queries
    let repetitiveCount = 0;
    for (let i = 0; i < userMessages.length - 1; i++) {
      for (let j = i + 1; j < userMessages.length; j++) {
        if (this.calculateSimilarity(userMessages[i], userMessages[j]) > 0.7) {
          repetitiveCount++;
        }
      }
    }

    if (repetitiveCount >= 2) {
      return {
        shouldEscalate: true,
        reason: 'unresolved_issue',
        priority: 'medium',
        escalationMessage: 'El cliente ha repetido consultas similares sin obtener una resolución satisfactoria.'
      };
    }

    return { shouldEscalate: false };
  }

  /**
   * Check for complaint indicators
   */
  private checkComplaintIndicators(userMessage: string): EscalationDecision {
    const message = userMessage.toLowerCase();
    const complaintKeywords = [
      'estoy molesto',
      'muy insatisfecho',
      'pésimo servicio',
      'quiero quejarme',
      'esto es inaceptable',
      'voy a dejar una mala reseña',
      'quiero mi dinero de vuelta',
      'esto es una estafa',
      'nunca más compro aquí',
      'furioso',
      'enojado',
      'indignado',
      'decepcionado',
      'frustrado'
    ];

    for (const keyword of complaintKeywords) {
      if (message.includes(keyword)) {
        return {
          shouldEscalate: true,
          reason: 'complaint_escalation',
          priority: 'urgent',
          escalationMessage: 'El cliente muestra signos de insatisfacción que requieren atención inmediata.'
        };
      }
    }

    return { shouldEscalate: false };
  }

  /**
   * Check for complex technical queries
   */
  private checkComplexity(userMessage: string): EscalationDecision {
    const message = userMessage.toLowerCase();
    const complexKeywords = [
      'compatibilidad específica',
      'configuración avanzada',
      'problema técnico complejo',
      'integración',
      'personalización',
      'desarrollo',
      'api',
      'código de error específico',
      'driver',
      'firmware',
      'bios',
      'overclock',
      'benchmark'
    ];

    let complexTermCount = 0;
    for (const keyword of complexKeywords) {
      if (message.includes(keyword)) {
        complexTermCount++;
      }
    }

    if (complexTermCount >= 2) {
      return {
        shouldEscalate: true,
        reason: 'complex_query',
        priority: 'high',
        escalationMessage: 'La consulta requiere conocimiento técnico especializado.'
      };
    }

    return { shouldEscalate: false };
  }

  /**
   * Generate escalation subject
   */
  private generateEscalationSubject(lastMessage: string, reason: string): string {
    const baseSubject = 'Consulta desde chatbot';
    
    switch (reason) {
      case 'customer_request':
        return `${baseSubject} - Solicitud de agente humano`;
      case 'complex_query':
        return `${baseSubject} - Consulta técnica compleja`;
      case 'complaint_escalation':
        return `${baseSubject} - Queja de cliente`;
      case 'unresolved_issue':
        return `${baseSubject} - Problema no resuelto`;
      default:
        return `${baseSubject} - Escalación automática`;
    }
  }

  /**
   * Generate escalation description
   */
  private generateEscalationDescription(
    lastMessage: string,
    reason: string,
    conversationHistory: Array<{ message: string; timestamp: Date; sender: 'user' | 'bot' }>
  ): string {
    let description = `Escalación automática desde el chatbot.\n\n`;
    description += `Razón de escalación: ${this.getEscalationReasonText(reason)}\n\n`;
    description += `Último mensaje del cliente: "${lastMessage}"\n\n`;
    
    if (conversationHistory.length > 0) {
      description += `Historial de conversación reciente:\n`;
      conversationHistory.slice(-5).forEach(msg => {
        const timestamp = msg.timestamp.toLocaleString('es-ES');
        const sender = msg.sender === 'user' ? 'Cliente' : 'Chatbot';
        description += `[${timestamp}] ${sender}: ${msg.message}\n`;
      });
    }

    return description;
  }

  /**
   * Get escalation reason text in Spanish
   */
  private getEscalationReasonText(reason: string): string {
    switch (reason) {
      case 'complex_query':
        return 'Consulta compleja que requiere conocimiento especializado';
      case 'customer_request':
        return 'Solicitud específica del cliente para hablar con un agente';
      case 'chatbot_limitation':
        return 'Limitación del chatbot para entender o resolver la consulta';
      case 'unresolved_issue':
        return 'Problema que no pudo ser resuelto por el chatbot';
      case 'complaint_escalation':
        return 'Escalación de queja o expresión de insatisfacción';
      default:
        return 'Razón de escalación no especificada';
    }
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
   * Clean up old conversation histories
   */
  cleanupOldConversations(): void {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const now = new Date();

    for (const [sessionId, history] of this.conversationHistories.entries()) {
      if (history.length > 0) {
        const lastMessage = history[history.length - 1];
        if (now.getTime() - lastMessage.timestamp.getTime() > maxAge) {
          this.conversationHistories.delete(sessionId);
        }
      }
    }
  }
}